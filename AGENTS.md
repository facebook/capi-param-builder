# AI Agent Guide for Conversions API Parameter Builder SDK

## Project Overview

The Conversions API Parameter Builder SDK is a multi-language toolkit designed
to improve the quality of Conversions API parameter retrieval and validation.
The SDK ensures event parameters adhere to best practices across multiple
platforms.

**Repository:** https://github.com/facebook/capi-param-builder

### Supported Languages

- **Server-side:** PHP, Java, NodeJS, Python, Ruby
- **Client-side:** JavaScript

Each language implementation lives in its own top-level directory with its own
build system, tests, examples, and documentation.

## Project Structure

```
param_sdk/
├── README.md              # Main project documentation
├── AGENTS.md              # AI Agent guidance (this file)
├── CODE_OF_CONDUCT.md     # Code of conduct
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # License file
├── composer.json          # PHP root composer file
├── .github/workflows/     # CI/CD workflows for all languages
├── java/                  # Java implementation
├── nodejs/                # Node.js implementation
├── php/                   # PHP implementation
├── python/                # Python implementation
└── ruby/                  # Ruby implementation
```

**Note:** The `client_js/` directory is **not open-sourced** yet, the dir only
contains examples.

Each language directory follows a consistent structure:

```
<language>/
├── README.md              # Language-specific quick start guide
├── CHANGELOG.md           # Version history and changes
├── CONTRIBUTING.md        # Contribution guidelines
├── CODE_OF_CONDUCT.md     # Code of conduct
├── LICENSE                # License file
├── capi-param-builder/    # Main SDK implementation (Python/Ruby use capi_param_builder with underscore)
│   ├── src/               # Source code
│   ├── tests/ or test/    # Unit tests
│   └── ...                # Language-specific build files
└── example/ or examples/  # Example usage code (PHP uses "examples")
```

## Core Functionality

The SDK provides utilities for:

- **Cookie parameter extraction** - Facebook click identifier (fbc) and browser
  identifier (fbp)
- **Client IP address retrieval** - Enhanced mechanisms for capturing client IP
  addresses with IPv6 support (IPv4 fallback when IPv6 is unavailable)
- **Customer Information Parameters normalization and hashing** - Tools to help
  adopt best practices for normalizing and hashing customer information
  including email, phone, name (first and last), address (city, state, zip code,
  country), gender, date of birth, external ID

For details on features, refer to the
[Parameter Builder Library](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library).

## Testing and Validation

### Critical Rule: Always Run Tests Before Committing Changes

**MANDATORY:** After making any code changes to a language implementation, you
MUST run the appropriate test command for that language before considering the
task complete.

### Test Commands by Language

#### Node.js

```bash
cd nodejs/capi-param-builder
npm install
npm test
```

Tested on Node.js versions: 18.x, 20.x, 22.x, 24.x

#### Python

```bash
cd python/capi_param_builder
python3 -m unittest test/test_param_builder.py
```

Tested on Python versions: 3.9, 3.10, 3.11

#### Java

```bash
cd java/capi-param-builder
chmod +x ./gradlew
./gradlew build
```

Tested on Java versions: 8, 11, 17, 21

#### PHP

```bash
cd php/capi-param-builder
composer install --dev --prefer-source
./vendor/bin/phpunit ./tests/ --debug
```

Tested on PHP versions: 7.4, 8.0, 8.1, 8.2, 8.3, 8.4

#### Ruby

```bash
cd ruby/capi_param_builder
gem install minitest
ruby -Ilib:test test/test_param_builder.rb
```

Tested on Ruby versions: 3.0, 3.2, 3.3

## Making Code Changes

### Language-Specific Considerations

1. **Maintain API Consistency**: All language implementations should provide
   equivalent functionality with language-appropriate idioms. When adding a
   feature to one language, consider whether it should be added to others.

2. **Backward Compatibility**: The SDK is used by external developers. We
   strongly recommend maintaining backward compatibility with existing flows.
   Breaking changes require:
   - Version bump (follow semantic versioning)
   - Changelog entry
   - Migration guide if necessary

3. **Human Review for Intrusive Changes**: If you have intrusive changes that
   could break existing integrations or significantly alter SDK behavior, please
   ensure human review before implementation. Always prefer backward-compatible
   solutions over breaking changes.

### Common File Locations

**Note:** Python and Ruby use `capi_param_builder` (with underscores) instead of
`capi-param-builder` (with dashes).

- **Core logic:** `<language>/capi-param-builder/src/` (or `capi_param_builder/`
  for Python/Ruby)
- **Tests:** `<language>/capi-param-builder/tests/` or
  `<language>/capi-param-builder/test/` (or `capi_param_builder/` for
  Python/Ruby)
- **Models:** `<language>/capi-param-builder/src/model/` or similar (or
  `capi_param_builder/` for Python/Ruby)
- **Utilities:** `<language>/capi-param-builder/src/utils/` (or
  `capi_param_builder/` for Python/Ruby)

### Workflow for Adding Features

1. **Research existing implementation** - Check if similar functionality exists
   in other language implementations
2. **Update the implementation** - Add code to `src/` directory
3. **Add tests** - Create or update test files with comprehensive test coverage
4. **Run tests locally** - Use the appropriate test command for the language
5. **Update documentation** - Update README.md and add inline code documentation
6. **Update CHANGELOG.md** - Document the change following existing format
7. **Bump version** - If the code change needs to be released, bump the version
   number following semantic versioning (see Version Files section below)
8. **Test examples** - Verify example code still works if applicable

### Version Files by Language

When bumping versions, update the version number in these files:

- **Node.js**: `nodejs/capi-param-builder/package.json`
- **Python**: `python/capi_param_builder/setup.py`
- **Java**: `java/capi-param-builder/build.gradle` and `java/build.gradle`
- **PHP**: `php/capi-param-builder/composer.json` and `composer.json`
- **Ruby**: `ruby/capi_param_builder/capi_param_builder.gemspec` with
  `ruby/capi_param_builder/lib/release_config.rb`

**Note:** For Client-side JavaScript (Meta Internal Only), see the dedicated
section above.

### Workflow for Fixing Bugs

1. **Reproduce the issue** - Write a failing test that demonstrates the bug
2. **Fix the implementation** - Make targeted changes to source code
3. **Verify the fix** - Ensure the new test passes
4. **Run full test suite** - Confirm no regressions
5. **Update CHANGELOG.md** - Document the bug fix
6. **Bump version** - If the bug fix needs to be released, bump the version
   number following semantic versioning
7. **Check other languages** - Verify if the same bug exists in other
   implementations

## CI/CD Pipeline

Each language has its own CI workflow in `.github/workflows/`:

- `<language>_ci.yml` - Continuous integration (runs tests)
- `<language>_cd.yml` - Continuous deployment (publishes packages)

CI runs automatically on:

- Push to any branch (for changed files in that language's directory)
- Pull requests
- Manual workflow dispatch

The CI matrix tests against multiple versions of each language runtime to ensure
compatibility.

## Best Practices

### Code Quality

- Follow language-specific conventions and style guides
- Keep functions focused and testable
- Add meaningful comments for complex logic
- Use descriptive variable and function names

### Testing

- Write unit tests for all new functionality
- Test edge cases (null, empty, invalid input)
- Mock external dependencies when appropriate

### Documentation

- Update README.md for public API changes
- Add inline documentation for complex functions
- Include usage examples for new features
- Keep CHANGELOG.md up to date

### Version Control

- Make focused commits with clear messages
- Reference issue numbers in commit messages
- Keep changes scoped to single language when possible
- Run tests before pushing

## Common Tasks

### Updating a shared constant

1. Find the constants file (e.g., `Constants.js`, `constants.py`)
2. Update the constant value
3. Check for tests that may be affected
4. Run full test suite
5. Update any dependent example code

### Adding a new parameter to the builder

1. Update the main builder class (e.g., `ParamBuilder.js`, `param_builder.py`)
2. Add validation logic if needed
3. Add tests for the new parameter
4. Update examples to show usage
5. Document in README.md

## External Resources

- [Parameter Builder Library Overview](https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-feature-library)
- [Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api)
- Language-specific READMEs in each directory

## Troubleshooting

### Tests failing after changes

1. Read the error message carefully - test frameworks provide specific failure
   details
2. Run tests in isolation to identify the failing test
3. Check if changes affected shared utilities or constants
4. Verify all dependencies are installed

### CI pipeline failures

1. Check the specific workflow that failed (language-specific)
2. Review the GitHub Actions logs for error details
3. Ensure changes work on all tested language versions
4. Verify no uncommitted files are required

### Dependency issues

1. Check package manager files for each language:
   - Node.js: `package.json`
   - Python: `setup.py`
   - Java: `build.gradle`
   - PHP: `composer.json`
   - Ruby: `capi_param_builder.gemspec`
2. Ensure versions are compatible with the tested runtime versions
3. Run clean install (delete `node_modules`, `.gradle`, cache, etc. and
   reinstall)

## Important Notes

- **Never commit secrets or credentials** - This is a public open-source project
- **Cross-language consistency** - Keep APIs and behavior consistent across
  implementations
- **Semantic versioning** - Follow semver for version bumps
- **Run tests before submitting** - All tests must pass before changes are
  complete
