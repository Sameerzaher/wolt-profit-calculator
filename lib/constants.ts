/** Max stored deliveries to keep localStorage fast and UI responsive */
export const MAX_STORED_DELIVERIES = 150;

/** Israel timezone for consistent "today" / display */
export const TIME_ZONE_IL = "Asia/Jerusalem";

/** Backup file schema version — bump when structure changes */
export const BACKUP_SCHEMA_VERSION = 2 as const;

/** Previous schema still accepted for import-only migration */
export const BACKUP_SCHEMA_VERSION_V1 = 1 as const;
