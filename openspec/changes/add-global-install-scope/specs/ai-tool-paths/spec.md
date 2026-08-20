## MODIFIED Requirements

### Requirement: AIToolOption skillsDir field
The `AIToolOption` interface SHALL include scope support metadata in addition to path metadata.

#### Scenario: Interface includes skillsDir field
- **WHEN** a tool entry is defined in `AI_TOOLS` that supports skill generation
- **THEN** it SHALL include a `skillsDir` field specifying the project-local base directory (e.g., `.claude`)

#### Scenario: Skills path follows Agent Skills spec
- **WHEN** generating skills for a tool with `skillsDir: '.claude'`
- **THEN** skills SHALL be written to `<projectRoot>/<skillsDir>/skills/`
- **AND** the `/skills` suffix is appended per Agent Skills specification

#### Scenario: Scope support metadata present
- **WHEN** a tool entry is defined in `AI_TOOLS`
- **THEN** it MAY declare supported install scopes for skills and commands
- **AND** this metadata SHALL be used for effective scope resolution

#### Scenario: Scope support metadata absent
- **WHEN** a tool entry in `AI_TOOLS` omits scope support metadata for a surface
- **THEN** resolver behavior SHALL default that surface to project-only support
- **AND** effective scope resolution SHALL apply normal preferred/fallback rules against that default

### Requirement: Path configuration for supported tools
Path metadata SHALL support both project and global install targets via resolver logic.

#### Scenario: Claude Code paths defined
- **WHEN** looking up the `claude` tool
- **THEN** `skillsDir` SHALL be `.claude`

#### Scenario: Cursor paths defined
- **WHEN** looking up the `cursor` tool
- **THEN** `skillsDir` SHALL be `.cursor`

#### Scenario: Windsurf paths defined
- **WHEN** looking up the `windsurf` tool
- **THEN** `skillsDir` SHALL be `.windsurf`

#### Scenario: Kimi Code paths defined
- **WHEN** looking up the `kimi` tool
- **THEN** `skillsDir` SHALL be `.kimi-code`
- **AND** OpenSpec-managed skills remaining under the legacy `.kimi/skills` directory SHALL be migrated to `.kimi-code/skills` during init and update, preserving user files

#### Scenario: Hermes Agent paths defined
- **WHEN** looking up the `hermes` tool
- **THEN** `skillsDir` SHALL be `.hermes`
- **AND** `setupNote` SHALL explain that project `.hermes/skills` must be added to `skills.external_dirs` in `~/.hermes/config.yaml`
- **AND** `openspec init` and `openspec update` SHALL display the note whenever `hermes` is configured

#### Scenario: Tools without skillsDir
- **WHEN** a tool has no `skillsDir` defined
- **THEN** skill generation SHALL error with message indicating the tool is not supported

#### Scenario: Project scope path
- **WHEN** effective scope is `project` for skills
- **THEN** `skillsDir` SHALL be treated as a tool-specific container path under project root
- **AND** managed skill artifacts SHALL be written under `<projectRoot>/<skillsDir>/skills/`
- **AND** tool definitions SHALL set `skillsDir` accordingly (for example `.openspec` -> `.openspec/skills/`)

#### Scenario: Global scope path
- **WHEN** effective scope is `global` for a supported tool/surface
- **THEN** paths SHALL resolve to tool-specific global directories
- **AND** environment overrides (for example `CODEX_HOME`) SHALL be respected where applicable

#### Scenario: Windows global path resolution for Codex commands
- **WHEN** effective scope is `global`
- **AND** tool is Codex
- **AND** platform is Windows
- **THEN** command targets SHALL resolve to `%CODEX_HOME%\prompts` when `CODEX_HOME` is set
- **AND** SHALL otherwise resolve to `%USERPROFILE%\.codex\prompts`
