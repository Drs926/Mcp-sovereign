import { readFile, writeFile, rename } from "fs/promises";
import { join } from "path";
import type { ProjectState } from "./models.js";
import { Mutex } from "./mutex.js";

const statePath = join(process.cwd(), "state", "PROJECT_STATE.json");
const mutex = new Mutex();

export const loadProjectState = async (): Promise<ProjectState> => {
  const raw = await readFile(statePath, "utf8");
  return JSON.parse(raw) as ProjectState;
};

const writeAtomicJson = async (path: string, data: ProjectState): Promise<void> => {
  const tmpPath = `${path}.tmp`;
  const content = JSON.stringify(data, null, 2);
  await writeFile(tmpPath, content, "utf8");
  await rename(tmpPath, path);
};

export const updateProjectState = async (
  updater: (state: ProjectState) => ProjectState
): Promise<ProjectState> => {
  return mutex.runExclusive(async () => {
    const currentRaw = await readFile(statePath, "utf8");
    let current: ProjectState;
    try {
      current = JSON.parse(currentRaw) as ProjectState;
    } catch (error) {
      throw new Error("PROJECT_STATE.json is corrupted; refusing write");
    }
    const next = updater(current);
    await writeAtomicJson(statePath, next);
    return next;
  });
};
