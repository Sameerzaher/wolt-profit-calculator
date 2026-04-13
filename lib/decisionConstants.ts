/** Hard reject: deliveries longer than this are not worth it by policy */
export const MAX_DISTANCE_REJECT_KM = 8;

/** NIS/km tier hints (doubles relax via DOUBLE_NIS_PER_KM_RELAX in code) */
export const NIS_PER_KM_STRONG = 6;
export const NIS_PER_KM_ACCEPT = 5;
export const NIS_PER_KM_DEPENDS = 4.5;

/** Score bonus when two short pickups are bundled */
export const DOUBLE_ORDER_SCORE_BONUS = 7;

/** Penalty when the route pulls you out of the hot zone */
export const LEAVES_HOT_ZONE_SCORE_PENALTY = 12;

/** When hourly is known and below this, apply a penalty */
export const LOW_HOURLY_THRESHOLD = 50;
export const LOW_HOURLY_SCORE_PENALTY = 9;

/** Map score 0–100 to decision bands */
export const SCORE_STRONG_ACCEPT_MIN = 85;
export const SCORE_ACCEPT_MIN = 70;
export const SCORE_DEPENDS_MIN = 55;

/** Flexibility: lowers effective NIS/km thresholds for tier text when double */
export const DOUBLE_NIS_PER_KM_RELAX = 0.35;
