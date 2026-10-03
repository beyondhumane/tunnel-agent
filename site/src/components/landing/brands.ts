import antigravity from '../../../../src/TunnelAgent.Avalonia/Assets/providers/antigravity.svg';
import claude from '../../../../src/TunnelAgent.Avalonia/Assets/providers/claude.svg';
import cursor from '../../../../src/TunnelAgent.Avalonia/Assets/providers/cursor.svg';
import devin from '../../../../src/TunnelAgent.Avalonia/Assets/providers/devin.svg';
import gemini from '../../../../src/TunnelAgent.Avalonia/Assets/providers/gemini.svg';
import kiro from '../../../../src/TunnelAgent.Avalonia/Assets/providers/kiro.svg';
import meta from '../../../../src/TunnelAgent.Avalonia/Assets/providers/meta.svg';
import openai from '../../../../src/TunnelAgent.Avalonia/Assets/providers/openai.svg';
import trae from '../../../../src/TunnelAgent.Avalonia/Assets/providers/trae.svg';
import xai from '../../../../src/TunnelAgent.Avalonia/Assets/providers/xai.svg';
import claudeCode from '../../../../src/TunnelAgent.Avalonia/Assets/agents/claude-code.svg';
import codex from '../../../../src/TunnelAgent.Avalonia/Assets/agents/codex.svg';
import factory from '../../../../src/TunnelAgent.Avalonia/Assets/agents/factory-droid.svg';
import grok from '../../../../src/TunnelAgent.Avalonia/Assets/agents/grok.svg';
import omp from '../../../../src/TunnelAgent.Avalonia/Assets/agents/omp.svg';
import opencode from '../../../../src/TunnelAgent.Avalonia/Assets/agents/opencode.svg';
import pi from '../../../../src/TunnelAgent.Avalonia/Assets/agents/pi.svg';

/** `mono: 'dark'` icons are drawn in black and are inverted in the dark theme. */
export type Brand = { name: string; icon?: string; mono?: 'dark'; detail?: string };

export const PROVIDERS: Brand[] = [
  { name: 'Claude', icon: claude, detail: 'OAuth' },
  { name: 'OpenAI', icon: openai, mono: 'dark', detail: 'OAuth' },
  { name: 'Gemini', icon: gemini, detail: 'API key' },
  { name: 'Antigravity', icon: antigravity, detail: 'OAuth' },
  { name: 'xAI', icon: xai, mono: 'dark', detail: 'OAuth' },
  { name: 'Devin', icon: devin, detail: 'OAuth' },
  { name: 'Meta', icon: meta, detail: 'OAuth' },
  { name: 'Kimi', detail: 'OAuth' },
  { name: 'Perplexity', detail: 'Session token' },
  { name: 'OpenAI-compatible', detail: 'API key' },
];

export const IDES: Brand[] = [
  { name: 'Cursor', icon: cursor, mono: 'dark' },
  { name: 'Kiro', icon: kiro },
  { name: 'Trae', icon: trae },
];

export const AGENTS: (Brand & { config: string })[] = [
  { name: 'Claude Code', icon: claudeCode, config: '~/.claude/settings.json' },
  { name: 'Codex CLI', icon: codex, config: '~/.codex/config.toml' },
  { name: 'OpenCode', icon: opencode, mono: 'dark', config: '~/.config/opencode/opencode.json' },
  { name: 'Pi', icon: pi, mono: 'dark', config: '~/.pi/agent/models.json' },
  { name: 'Oh My Pi', icon: omp, config: '~/.omp/agent/models.yml' },
  { name: 'Factory Droid', icon: factory, mono: 'dark', config: '~/.factory/settings.json' },
  { name: 'Grok Build', icon: grok, mono: 'dark', config: '~/.grok/config.toml' },
];
