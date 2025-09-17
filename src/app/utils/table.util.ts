export function buildDisplayKeys(sample: any): string[] {
if (!sample) return [];
const all = Object.keys(sample);
const drop = new Set([
'id','ID','dataType','headway','dayType',
'direction','Direction','isDeleted',
'updatedDateTime','updatedUserId','detail',
'deletedUserId','deletedDateTime','createdUserId','createdDateTime'
]);
const filtered = all.filter(k => !drop.has(k));
const idx = filtered.findIndex(k => ['trainNo','TrainNo'].includes(k));
if (idx > 0) { const [k] = filtered.splice(idx, 1); filtered.unshift(k); }
return filtered;
}