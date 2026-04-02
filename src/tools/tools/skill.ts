import path from 'pathe';
import { z } from 'zod';
import type { Context } from '../../core/context';
import type { SkillManager, SkillMetadata } from '../../skill/skill';
import { createTool, type Tool } from '../tool';
import { safeStringify } from '../../utils/safeStringify';
import { createTaskTool } from './task';
import { randomUUID } from '../../utils/randomUUID';

function renderAvailableSkills(skills: SkillMetadata[]): string {
  return skills
    .filter((skill) => skill.modelInvocable !== false)
    .map(
      (skill) =>
        `<skill>\n<name>${skill.name}</name>\n<description>${skill.description}</description>\n</skill>`,
    )
    .join('\n');
}

function generateDescription(skillManager: SkillManager): string {
  const skills = skillManager.getSkills({ modelInvocable: true });
  return `Execute a skill within the main conversation
<skills_instructions>
When users ask you to perform tasks, check if any of the available skills below match the task. If a skill matches, use this tool to invoke it. Skills provide specialized knowledge and procedures for specific tasks.
</skills_instructions>
<available_skills>
${renderAvailableSkills(skills)}
</available_skills>`;
}

export interface CreateSkillToolOpts {
  skillManager: SkillManager;
  context: Context;
  tools: Tool[];
  sessionId: string;
  signal?: AbortSignal;
}

export function createSkillTool(opts: CreateSkillToolOpts) {
  const { skillManager, context, tools, sessionId, signal } = opts;

  return createTool({
    name: 'skill',
    description: generateDescription(skillManager),
    parameters: z.object({
      skill: z.string().describe('The skill name to execute'),
      args: z
        .string()
        .optional()
        .describe('Optional arguments to pass to the skill'),
    }),
    getDescription: ({ params }) => {
      return params.args
        ? `${params.skill} ${params.args}`
        : params.skill;
    },
    async execute({ skill, args }) {
      const trimmed = skill.trim();
      const skillName = trimmed.startsWith('/')
        ? trimmed.substring(1)
        : trimmed;
      const foundSkill = skillManager.getSkill(skillName);

      if (!foundSkill) {
        return {
          isError: true,
          llmContent: `Skill "${skillName}" not found`,
        };
      }

      // Check if skill can be invoked by model
      if (foundSkill.modelInvocable === false) {
        return {
          isError: true,
          llmContent: `Skill "${skillName}" cannot be invoked by the model`,
        };
      }

      const skillArgs = args || '';
      const body = await skillManager.readSkillBody(foundSkill, skillArgs);
      const baseDir = path.dirname(foundSkill.path);

      // If skill has context: 'fork', use task tool for isolated execution
      if (foundSkill.context === 'fork') {
        if (!context.agentManager) {
          return {
            isError: true,
            llmContent: `Skill "${skillName}" requires fork execution but agent manager is not available`,
          };
        }

        // Create filtered tools list based on allowedTools
        // Exclude 'skill' tool itself to prevent recursive invocation loops
        const allowedTools = foundSkill.allowedTools;
        const filteredTools = allowedTools
          ? tools.filter(
              (t) =>
                t.name !== 'skill' &&
                allowedTools.some(
                  (allowed) =>
                    allowed.toLowerCase() === t.name.toLowerCase(),
                ),
            )
          : tools.filter((t) => t.name !== 'skill');

        // Create task tool with filtered tools
        const taskTool = createTaskTool({
          context,
          tools: filteredTools,
          sessionId,
          signal,
        });

        // Execute skill as a task
        const agentType = foundSkill.agent || 'general-purpose';
        const prompt = `Base directory for this skill: ${baseDir}\n\n${body}`;

        // Generate a unique toolCallId for tracking
        const toolCallId = `skill-${skillName}-${randomUUID()}`;

        return taskTool.execute(
          {
            description: `Execute skill: ${skillName}`,
            prompt,
            subagent_type: agentType,
          },
          toolCallId,
        );
      }

      // Inline execution (default)
      const messages = [
        {
          type: 'text',
          text: `<command-message>${skillName} is running…</command-message>\n<command-name>${skillName}</command-name>`,
        },
        {
          type: 'text',
          text: `Base directory for this skill: ${baseDir}\n\n${body}`,
          isMeta: true,
        },
      ];

      return {
        llmContent: safeStringify(messages),
        returnDisplay: `Loaded skill: ${foundSkill.name}`,
      };
    },
    approval: { category: 'read' },
  });
}
