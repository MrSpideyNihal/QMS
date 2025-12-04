# Quick Guide: How to Assign Tables to Tokens

## Option 1: Auto-Assignment (Recommended)

### Using Browser Console:
1. Open http://localhost:3000/queue
2. Press F12 to open Developer Tools
3. Go to "Console" tab
4. Paste this code and press Enter:

```javascript
fetch('/api/queue/auto-assign', { method: 'POST' })
  .then(r => r.json())
  .then(d => {
    console.log(d);
    alert(`Assigned ${d.assignedCount} tokens to tables!`);
    location.reload();
  });
```

This will automatically assign all waiting tokens to available tables!

## Option 2: Manual Assignment via API

### Assign a specific token to a specific table:

1. Get the token ID from the queue page (it's in the URL or data)
2. Get the table ID from /tables page
3. Use this code in browser console:

```javascript
// Replace these with actual IDs
const tokenId = 'YOUR_TOKEN_ID_HERE';
const tableId = 'YOUR_TABLE_ID_HERE';

fetch(`/api/tokens/${tokenId}/assign`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tableIds: [tableId],
    assignmentType: 'single'
  })
})
.then(r => r.json())
.then(d => {
  console.log(d);
  alert('Table assigned!');
  location.reload();
});
```

## Option 3: Add Assign Button to Queue Page

I can add a proper "Assign" button to the queue page if you'd like. This would allow you to:
1. Click "Assign" next to any waiting token
2. Select a table from a dropdown
3. Assign with one click

Would you like me to add this feature?

## Quick Test Workflow:

1. **Create a token**: Go to /tokens/new
2. **View queue**: Go to /queue (you'll see it in "waiting" status)
3. **Auto-assign**: Run the auto-assign code from console
4. **Check result**: The token should now show as "seated"
5. **Complete**: Click "Complete" when customer finishes

## Tables Status:
- Go to /tables to see all tables and their status
- Green = Free (available for assignment)
- Red = Occupied
- Yellow = Reserved
- Blue = Shared
