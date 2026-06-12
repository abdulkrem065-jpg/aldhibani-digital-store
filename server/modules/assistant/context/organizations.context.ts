import { StaffUser } from '../../../../src/types';

export async function getOrganizationsContext(storeDatabase: any, supabase: any, orgId?: string): Promise<string> {
  try {
    let staff: StaffUser[] = [];

    // Prioritize querying Supabase if connected
    if (supabase) {
      const query = supabase.from('staff_users').select('*');
      if (orgId) {
        query.eq('org_id', orgId);
      }
      const { data, error } = await query;
      if (!error && data) {
        staff = data;
      } else {
        staff = storeDatabase.staffUsers || [];
      }
    } else {
      staff = storeDatabase.staffUsers || [];
    }

    const config = storeDatabase.config || {};
    
    // Distribute staff by Roles
    const roleStats: { [key: string]: number } = {};
    staff.forEach(u => {
      roleStats[u.role] = (roleStats[u.role] || 0) + 1;
    });

    const contextJSON = {
      organization: {
        id: orgId || config.orgId || 'org_vip_default',
        name_ar: config.shopNameAR || 'مستودع ومتجر الذيباني VIP',
        name_en: config.shopNameEN || 'Al-Dhibani VIP Store',
        industry: 'RETAIL',
        current_tier: 'PRO',
        status: 'ACTIVE'
      },
      staff_metrics: {
        total_staff_users: staff.length,
        roles_distribution: roleStats
      },
      infrastructure: {
        integration_type: config.integrationType || 'WEB',
        remote_sync_status: config.remoteSyncStatus || 'CONNECTED',
        last_sync_time: config.remoteLastSyncTime || new Date().toISOString()
      }
    };

    return JSON.stringify(contextJSON, null, 2);
  } catch (error: any) {
    console.error('Error compiling organization context:', error);
    return JSON.stringify({ error: 'Failed to compile organization context: ' + error.message });
  }
}
