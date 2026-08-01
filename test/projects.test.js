import assert from "node:assert/strict";
import test from "node:test";

import { projects } from "../src/projects.js";

test("project slugs map to GitHub owner and repository names", () => {
  for (const [slug, repository] of Object.entries(projects)) {
    assert.match(slug, /^[a-z0-9-]+$/);
    assert.match(repository, /^[^/]+\/[^/]+$/);
  }
});
