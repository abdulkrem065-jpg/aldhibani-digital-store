import crypto from 'crypto';

export interface LegacyMapping {
  legacy_id: string | number;
  new_uuid: string;
  entity_type: string;
}

export class UUIDGenerator {
  private static mapping: Map<string, string> = new Map();

  /**
   * Translates a legacy integer/string ID into a unique UUID.
   * If the ID has already been translated for this entity type,
   * it returns the same UUID to preserve foreign key relationships.
   */
  public static getOrCreate(legacyId: string | number, entityType: string): string {
    if (legacyId === undefined || legacyId === null || legacyId === '') {
      return crypto.randomUUID();
    }
    
    const key = `${entityType}:${legacyId}`;
    if (this.mapping.has(key)) {
      return this.mapping.get(key)!;
    }

    // Creating a deterministic UUIDv4 based on the string namespace
    // hash using md5/sha1 to generate stable UUID-like format (8-4-4-4-12)
    const hash = crypto.createHash('sha1').update(key).digest('hex');
    const uuid = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      // Set the four most significant bits of the 7th byte to 0100 (version 4)
      '4' + hash.substring(13, 16),
      // Set the two most significant bits of the 9th byte to 10 (clock sequence)
      (parseInt(hash.substring(16, 17), 16) & 0x3 | 0x8).toString(16) + hash.substring(17, 20),
      hash.substring(20, 32)
    ].join('-');

    this.mapping.set(key, uuid);
    return uuid;
  }

  /**
   * Retrieves the current mapping registry for debugging and loading mapping tables.
   */
  public static getMappingTable(): LegacyMapping[] {
    const list: LegacyMapping[] = [];
    this.mapping.forEach((uuid, key) => {
      const parts = key.split(':');
      const entityType = parts[0];
      const legacyId = parts.slice(1).join(':'); // handle IDs with colons
      list.push({ legacy_id: legacyId, new_uuid: uuid, entity_type: entityType });
    });
    return list;
  }

  /**
   * Standardizes a given list of UUID mappings
   */
  public static preseed(mappings: LegacyMapping[]) {
    for (const map of mappings) {
      const key = `${map.entity_type}:${map.legacy_id}`;
      this.mapping.set(key, map.new_uuid);
    }
  }

  /**
   * Reset mapping table state.
   */
  public static reset() {
    this.mapping.clear();
  }
}
