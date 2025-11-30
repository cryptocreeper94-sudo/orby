import type { User, Stand, Item, Message, NPO, StaffingGroup, SupervisorDoc, InventoryCount } from "@shared/schema";

const API_BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

// Auth
export async function loginWithPin(pin: string): Promise<{ user: User }> {
  return fetchJson("/auth/login", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function logout(userId: string): Promise<void> {
  await fetchJson("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

// Users
export async function getUsers(): Promise<User[]> {
  return fetchJson("/users");
}

export async function getUsersByRole(role: string): Promise<User[]> {
  const users = await getUsers();
  return users.filter(u => u.role === role);
}

export async function getUser(id: string): Promise<User> {
  return fetchJson(`/users/${id}`);
}

// Stands
export async function getStands(): Promise<Stand[]> {
  return fetchJson("/stands");
}

export async function getStand(id: string): Promise<Stand> {
  return fetchJson(`/stands/${id}`);
}

export async function getStandsBySection(section: string): Promise<Stand[]> {
  return fetchJson(`/stands/section/${encodeURIComponent(section)}`);
}

export async function getStandsBySupervisor(supervisorId: string): Promise<Stand[]> {
  return fetchJson(`/stands/supervisor/${supervisorId}`);
}

export async function updateStandStatus(id: string, status: string): Promise<void> {
  await fetchJson(`/stands/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateStandAssets(id: string, e700Ids: string[], a930Ids: string[]): Promise<void> {
  await fetchJson(`/stands/${id}/assets`, {
    method: "PATCH",
    body: JSON.stringify({ e700Ids, a930Ids }),
  });
}

// Items
export async function getItems(): Promise<Item[]> {
  return fetchJson("/items");
}

// Inventory Counts
export async function getInventoryCounts(standId: string, eventDate: string): Promise<InventoryCount[]> {
  return fetchJson(`/inventory/${standId}/${encodeURIComponent(eventDate)}`);
}

export async function saveInventoryCount(count: {
  standId: string;
  itemId: string;
  eventDate: string;
  startCount?: number;
  adds?: number;
  endCount?: number;
  spoilage?: number;
  sold?: number;
}): Promise<InventoryCount> {
  return fetchJson("/inventory", {
    method: "POST",
    body: JSON.stringify(count),
  });
}

// Messages
export async function getMessages(): Promise<Message[]> {
  return fetchJson("/messages");
}

export async function createMessage(message: {
  senderId: string;
  content: string;
  type: "Global" | "Urgent" | "Request";
}): Promise<Message> {
  return fetchJson("/messages", {
    method: "POST",
    body: JSON.stringify(message),
  });
}

// NPOs
export async function getNpos(): Promise<NPO[]> {
  return fetchJson("/npos");
}

// Staffing Groups
export async function getStaffingGroups(): Promise<StaffingGroup[]> {
  return fetchJson("/staffing-groups");
}

export async function createStaffingGroup(group: {
  name: string;
  supervisorId?: string;
  standIds?: string[];
  npoId?: string;
  eventDate?: string;
}): Promise<StaffingGroup> {
  return fetchJson("/staffing-groups", {
    method: "POST",
    body: JSON.stringify(group),
  });
}

// Supervisor Docs
export async function getSupervisorDocs(): Promise<SupervisorDoc[]> {
  return fetchJson("/supervisor-docs");
}

// Seed database
export async function seedDatabase(): Promise<{ message: string; seeded: boolean }> {
  return fetchJson("/seed", { method: "POST" });
}
