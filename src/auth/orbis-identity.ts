import { authClient } from './client'

const endpoint = 'https://orbis-admin-staging.onrender.com/api/v1/customer/session'
const identityId = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const displayId = /^ORB-U-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/u
export async function loadOrbisIdentity(userId: string, signal: AbortSignal): Promise<string> {
  if (!authClient) throw new Error('ORBIS_ID_UNAVAILABLE')
  const { data, error } = await authClient.auth.getSession()
  if (error || !data.session || data.session.user.id !== userId) throw new Error('ORBIS_ID_UNAVAILABLE')
  // The server verifies this live Auth session before creating/reusing the canonical ID.
  // No user metadata, local Auth ID or client-generated ID is presented as an Orbis ID.
  const response = await fetch(endpoint, {
    headers: { authorization: `Bearer ${data.session.access_token}` },
    credentials: 'omit', redirect: 'error', cache: 'no-store', signal,
  })
  if (!response.ok) throw new Error('ORBIS_ID_UNAVAILABLE')
  const text = await response.text()
  if (text.length > 65536) throw new Error('ORBIS_ID_UNAVAILABLE')
  const value: unknown = JSON.parse(text)
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 'orbis.customer.v1' ||
      !('customer' in value) || !value.customer || typeof value.customer !== 'object') throw new Error('ORBIS_ID_UNAVAILABLE')
  const customer = value.customer
  if (!('orbisIdentityId' in customer) || typeof customer.orbisIdentityId !== 'string' || !identityId.test(customer.orbisIdentityId) ||
      !('displayId' in customer) || typeof customer.displayId !== 'string' || !displayId.test(customer.displayId)) throw new Error('ORBIS_ID_UNAVAILABLE')
  return customer.displayId
}

