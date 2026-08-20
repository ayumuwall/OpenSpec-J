## MODIFIED Requirements

### Requirement: ToolCommandAdapter interface
The system SHALL provide install-context-aware command path resolution.

#### Scenario: Adapter interface structure
- **WHEN** implementing a tool adapter
- **THEN** command file path resolution SHALL receive install context (including effective scope and environment context)
- **AND** SHALL return the effective command output path for that context

#### Scenario: Codex global path remains supported
- **WHEN** resolving Codex command paths in global scope
- **THEN** the adapter SHALL target `$CODEX_HOME/prompts` when `CODEX_HOME` is set
- **AND** SHALL otherwise target `~/.codex/prompts`

#### Scenario: Claude adapter formatting
- **WHEN** formatting a command for Claude Code
- **THEN** the adapter SHALL output YAML frontmatter with `name`, `description`, `category`, `tags` fields
- **AND** file path SHALL follow pattern `.claude/commands/opsx/<id>.md`

#### Scenario: Cursor adapter formatting
- **WHEN** formatting a command for Cursor
- **THEN** the adapter SHALL output YAML frontmatter with `name` as `/opsx-<id>`, `id`, `category`, `description` fields
- **AND** file path SHALL follow pattern `.cursor/commands/opsx-<id>.md`

#### Scenario: Windsurf adapter formatting
- **WHEN** formatting a command for Windsurf
- **THEN** the adapter SHALL output YAML frontmatter with `name`, `description`, `category`, `tags` fields
- **AND** file path SHALL follow pattern `.windsurf/workflows/opsx-<id>.md`

#### Scenario: Trae adapter formatting
- **WHEN** formatting a command for Trae
- **THEN** the adapter SHALL output YAML frontmatter with `name` and `description` fields
- **AND** file path SHALL follow pattern `.trae/commands/opsx-<id>.md`

### Requirement: Command generator function
The command generator SHALL pass install context into adapter path resolution for all generated commands.

#### Scenario: Scoped command generation
- **WHEN** generating commands for a tool with a resolved effective scope
- **THEN** generated command paths SHALL match that effective scope
- **AND** the formatted command body/frontmatter behavior SHALL remain tool-specific and unchanged

#### Scenario: Generate command file
- **WHEN** calling `generateCommand(content, adapter)`
- **THEN** it SHALL return an object with `path` and `fileContent` from the adapter

#### Scenario: Command references match the name the tool registers
- **WHEN** an adapter names commands by filename
- **THEN** `generateCommand` SHALL rewrite references to that registered form

#### Scenario: Command references use the tool's own invocation prefix
- **WHEN** an adapter declares an `invocationPrefix`
- **THEN** generated references SHALL use that prefix

#### Scenario: Generate multiple commands
- **WHEN** generating all opsx commands for a tool
- **THEN** the system SHALL generate each command using the tool's adapter
