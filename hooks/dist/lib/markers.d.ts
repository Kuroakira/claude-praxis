export declare function getMarkerDir(): string;
export declare function appendSkillMarker(markerDir: string, sessionId: string, skillName: string): void;
export declare function hasSkill(markerDir: string, sessionId: string, skillName: string): boolean;
export declare function markerExists(markerPath: string): boolean;
export declare function touchMarker(markerPath: string): void;
export declare function cleanSessionMarkers(markerDir: string, sessionId: string): void;
