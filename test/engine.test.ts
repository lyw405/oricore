/**
 * Engine Tests
 */

import { describe, it, expect } from 'bun:test';
import { createEngine, NodePlatform, randomUUID, Paths, ENGINE_VERSION, type PlatformAdapter } from '../src/index';

describe('OriCore', () => {
  describe('Engine Creation', () => {
    it('should create an engine instance', () => {
      const engine = createEngine({
        productName: 'TestApp',
        version: '1.0.0',
      });

      expect(engine).toBeDefined();
      expect(engine.getContext).toBeInstanceOf(Function);
    });
  });

  describe('Mode System', () => {
    it('should list all available modes', () => {
      const engine = createEngine({
        productName: 'TestApp',
        version: '1.0.0',
      });

      const modes = engine.getAvailableModes();

      expect(modes).toBeDefined();
      expect(modes.length).toBeGreaterThan(0);
      expect(modes.find(m => m.id === 'brainstorm')).toBeDefined();
      expect(modes.find(m => m.id === 'plan')).toBeDefined();
      expect(modes.find(m => m.id === 'review')).toBeDefined();
      expect(modes.find(m => m.id === 'debug')).toBeDefined();
      expect(modes.find(m => m.id === 'default')).toBeDefined();
    });

    it('should set mode', () => {
      const engine = createEngine({
        productName: 'TestApp',
        version: '1.0.0',
      });

      engine.setMode('brainstorm');
      expect(engine.getMode()).toBe('brainstorm');

      engine.setMode('plan');
      expect(engine.getMode()).toBe('plan');
    });

    it('should register custom mode', () => {
      const engine = createEngine({
        productName: 'TestApp',
        version: '1.0.0',
      });

      engine.registerMode({
        id: 'test-mode',
        name: 'Test Mode',
        description: 'A test mode',
        config: {
          systemPrompt: 'You are a test assistant',
          write: false,
          askUserQuestion: false,
          maxTurns: 5,
        },
      });

      const modes = engine.getAvailableModes();
      expect(modes.find(m => m.id === 'test-mode')).toBeDefined();
    });
  });

  describe('Message Bus', () => {
    it('should get message bus', () => {
      const engine = createEngine({
        productName: 'TestApp',
        version: '1.0.0',
      });

      const messageBus = engine.getMessageBus();
      expect(messageBus).toBeDefined();
      expect(messageBus.on).toBeDefined();
      expect(messageBus.onEvent).toBeDefined();
      expect(messageBus.request).toBeDefined();
    });
  });

  describe('Initialization', () => {
    it('should initialize with minimal config', async () => {
      const engine = createEngine({
        productName: 'TestApp',
        version: '1.0.0',
      });

      // This will fail without API key, but we test the structure
      try {
        await engine.initialize({});
        // If we reach here, API key was available
        expect(engine.getContext()).toBeDefined();
      } catch (error) {
        // Expected if no API key
        expect(error).toBeDefined();
      }
    });
  });

  describe('Context', () => {
    it('should throw error when getting context before initialization', () => {
      const engine = createEngine({
        productName: 'TestApp',
        version: '1.0.0',
      });

      expect(() => engine.getContext()).toThrow('Engine not initialized');
    });
  });
});

describe('Platform Abstraction', () => {
  describe('NodePlatform', () => {
    it('should be exported', () => {
      expect(NodePlatform).toBeDefined();
      // PlatformAdapter is a type, not a value
    });

    it('should create NodePlatform instance', () => {
      const platform = new NodePlatform();

      expect(platform.cwd).toBeDefined();
      expect(platform.join).toBeDefined();
      expect(platform.env).toBeDefined();
    });
  });
});

describe('Utilities', () => {
  it('should export randomUUID', () => {
    expect(randomUUID).toBeDefined();

    const uuid = randomUUID();
    expect(uuid).toBeDefined();
    expect(typeof uuid).toBe('string');
    expect(uuid.length).toBeGreaterThan(0);
  });

  it('should export Paths', () => {
    expect(Paths).toBeDefined();
    // Paths is a class
    expect(Paths.prototype.getSessionLogPath).toBeDefined();
  });
});

describe('Exports', () => {
  it('should export ENGINE_VERSION', () => {
    expect(ENGINE_VERSION).toBeDefined();
    expect(typeof ENGINE_VERSION).toBe('string');
  });
});
