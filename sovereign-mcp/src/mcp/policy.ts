export const inboundTools = new Set([
  "sovereign.health",
  "sovereign.list_downstreams",
  "sovereign.call_downstream",
  "project.get_state",
  "project.get_history",
  "event.append",
  "verdict.set",
  "task.set_active",
  "task.set_status",
  "proof.append"
]);

export const writeOnlyTools = new Set([
  "event.append",
  "verdict.set",
  "task.set_active",
  "task.set_status",
  "proof.append"
]);

export const downstreamAllowlist: Record<string, Set<string>> = {
  stitch: new Set([
    "list_projects",
    "get_project",
    "list_screens",
    "get_screen",
    "fetch_screen_code",
    "fetch_screen_image",
    "generate_screen_fr"
  ]),
  memory_accelerator: new Set([
    "memory_index_status",
    "memory_list_recent",
    "memory_reindex",
    "memory_search"
  ])
};

export const downstreamReadAllowlist: Record<string, Set<string>> = {
  stitch: new Set([
    "list_projects",
    "get_project",
    "list_screens",
    "get_screen",
    "fetch_screen_code",
    "fetch_screen_image"
  ]),
  memory_accelerator: new Set([
    "memory_index_status",
    "memory_list_recent",
    "memory_search"
  ])
};
