export class OrganizationInjector {
  /**
   * Ingests and stamps records with multi-tenant contexts, preventing cross-tenant pollution.
   */
  public static inject(
    entity: Record<string, any>,
    orgId: string,
    branchId: string,
    userId: string
  ): Record<string, any> {
    if (!orgId) {
      throw new Error('[OrganizationInjector] Missing mandatory organization_id context.');
    }

    return {
      ...entity,
      organization_id: orgId,
      org_id: orgId,
      orgId: orgId,
      
      branch_id: branchId || 'main-branch-uuid',
      branchId: branchId || 'main-branch-uuid',
      
      created_by: userId || 'system-admin-uuid',
      operator_id: userId || 'system-admin-uuid',
      created_at: entity.created_at || new Date().toISOString()
    };
  }

  /**
   * Stitches arrays of records with organization context batch-wise.
   */
  public static injectBatch(
    entities: Record<string, any>[],
    orgId: string,
    branchId: string,
    userId: string
  ): Record<string, any>[] {
    return entities.map(entity => this.inject(entity, orgId, branchId, userId));
  }
}
