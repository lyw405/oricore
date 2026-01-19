import type { Context } from '../../../core/context';
import type { AgentDefinition } from '../types';
import { createExploreAgent } from './explore';
import { createGeneralPurposeAgent } from './general-purpose';

export function getBuiltinAgents(opts: {
  context: Context;
}): AgentDefinition[] {
  return [
    createExploreAgent(opts),
    createGeneralPurposeAgent(opts),
  ];
}
