'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

async function main() {
  const diffPath = process.argv[2];
  if (!diffPath) {
    process.stderr.write('Usage: node scripts/verify-pr.js <diff-file-path>\n');
    process.exit(1);
  }

  const diff = fs.readFileSync(diffPath, 'utf8');

  const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
  let claudeMd = '';
  try {
    claudeMd = fs.readFileSync(claudeMdPath, 'utf8');
  } catch (e) {
    process.stderr.write(`Warning: could not read CLAUDE.md: ${e.message}\n`);
  }

  if (!diff.trim()) {
    process.stdout.write(JSON.stringify({ findings: [] }));
    return;
  }

  const client = new Anthropic.default();

  const systemPrompt = `You are a strict code reviewer for a Node.js + React e-commerce catalog project.
Here are the project rules (from CLAUDE.md):

${claudeMd}

## Verification Checklist
- STORE CONTRACT: No code outside backend/src/store/ may access the Map directly. All store access must use exported store functions.
- APP.JS LISTEN: app.js must never call listen(). Only server.js calls listen().
- HARDCODED SECRETS: No API keys, passwords, or tokens hardcoded in source. Must use environment variables.
- ERROR LOGGING: Every catch block must log { timestamp, operation, input, error, stack }. Silent catch is a P0 violation.
- RETRY LOGIC: External API calls (fetch, axios, SDK calls) must include error handling. Missing retry on new external calls = P1.
- IDEMPOTENCY: Webhook handlers and event processors must be idempotent.
- USEEFFECT CLEANUP: Every useEffect with subscriptions, timers, or event listeners must return a cleanup function.

## Severity Levels
- P0: Non-negotiable violated (store contract, app.js listen(), hardcoded secret, silent catch on a new error path, useEffect missing cleanup on timer/subscription)
- P1: Missing retry on new external call, missing idempotency on new webhook/event handler
- P2: Style, naming, minor improvement

Respond ONLY with valid JSON — no markdown, no explanation outside the JSON:
{"findings":[{"severity":"P0"|"P1"|"P2","file":"path/to/file.js","line":42,"message":"concise description"}]}
If no findings: {"findings":[]}`;

  const userPrompt = `Review this PR diff:\n\n\`\`\`diff\n${diff.slice(0, 60000)}\n\`\`\`\n\nRespond ONLY with the JSON findings object.`;

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
  } catch (err) {
    process.stderr.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      operation: 'verify-pr.claude-api',
      error: err.message,
      stack: err.stack,
    }) + '\n');
    // Fail open: API outage must not block all PRs
    process.stdout.write(JSON.stringify({ findings: [] }));
    return;
  }

  const text = (response.content[0]?.text || '').trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    process.stderr.write(`Warning: model returned non-JSON: ${text.slice(0, 200)}\n`);
    parsed = { findings: [] };
  }

  process.stdout.write(JSON.stringify(parsed));
}

main().catch(err => {
  process.stderr.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    operation: 'verify-pr.main',
    error: err.message,
    stack: err.stack,
  }) + '\n');
  process.stdout.write(JSON.stringify({ findings: [] }));
});
