# Practical Examples - Using the Dynamic Application

## Example 1: Add a New Technology Category

Want to add notes for "Docker Compose"? Here's how:

### Step 1: Edit data.json

Add this to the JSON (after SRE section, before the closing brace):

```json
{
  "Docker": [...existing notes...],
  "Kubernetes": [...existing notes...],
  "Terraform": [...existing notes...],
  "SRE": [...existing notes...],
  "Docker_Compose": [
    {
      "q": "What is Docker Compose?",
      "a": "Docker Compose is a tool for defining and running multi-container Docker applications using a YAML file."
    },
    {
      "q": "How do you start services with Compose?",
      "a": "Use 'docker-compose up' to start all services defined in docker-compose.yml"
    }
  ]
}
```

### Step 2: Refresh the browser

✅ **Result**: 
- New "Docker_Compose" category appears in sidebar
- Shows count of 2
- Click to see the notes
- **No code changes required!**

---

## Example 2: Rename a Category

Want to rename "SRE" to "Site Reliability"?

### Step 1: Edit data.json

```json
{
  "Docker": [...],
  "Kubernetes": [...],
  "Terraform": [...],
  "Site Reliability": [    // Changed from "SRE"
    ...all the SRE notes...
  ]
}
```

### Step 2: Refresh the browser

✅ **Result**: 
- Sidebar now shows "Site Reliability" instead of "SRE"
- All notes are preserved
- **No code changes required!**

---

## Example 3: Reorder Categories

Want categories in this order: Kubernetes → Docker → Terraform → SRE?

### Step 1: Edit data.json

Simply rearrange the order of the keys:

```json
{
  "Kubernetes": [...],
  "Docker": [...],
  "Terraform": [...],
  "SRE": [...]
}
```

### Step 2: Refresh the browser

✅ **Result**: 
- Categories appear in sidebar in the new order
- "Kubernetes" is now the first (default selected)
- **No code changes required!**

---

## Example 4: Delete a Category

Want to remove "Terraform" temporarily?

### Step 1: Edit data.json

Simply remove the entire "Terraform" section:

```json
{
  "Docker": [...],
  "Kubernetes": [...],
  "SRE": [...]
}
```

### Step 2: Refresh the browser

✅ **Result**: 
- "Terraform" no longer appears in sidebar
- Other categories unaffected
- **No code changes required!**

---

## Example 5: Add Multiple Notes to a Category

Want to add 3 new Docker notes?

### Step 1: Edit data.json

```json
{
  "Docker": [
    {
      "q": "What is a Docker image vs a container?",
      "a": "An image is a read-only template; a container is a runtime instance of that image."
    },
    {
      "q": "How do you reduce image size?",
      "a": "Use smaller base images, multi-stage builds, remove build tools and cache, and minimize layers."
    },
    {
      "q": "How do you persist data?",
      "a": "Use volumes or bind mounts to keep data outside the container filesystem."
    },
    {
      "q": "What is the difference between EXPOSE and PUBLISH?",
      "a": "EXPOSE documents ports in dockerfile, -p publishes (exposes) them at runtime."
    },
    {
      "q": "How do you create a Docker network?",
      "a": "Use 'docker network create' to create custom bridge networks for container communication."
    },
    {
      "q": "What are Docker Volumes?",
      "a": "Volumes are storage managed by Docker, independent of container lifecycle, for persisting data."
    }
  ],
  "Kubernetes": [...],
  "Terraform": [...],
  "SRE": [...]
}
```

### Step 2: Refresh the browser

✅ **Result**: 
- Docker count updates from 3 to 6
- All 6 Docker notes appear in the list
- **No code changes required!**

---

## Example 6: Update Existing Note Content

Found a typo in a Kubernetes note?

### Step 1: Edit data.json

Change the answer text:

```json
"Kubernetes": [
  {
    "q": "What is a Pod?",
    "a": "The smallest deployable unit in Kubernetes, may contain one or more containers. It's a wrapper around containers."
  },
  ...rest of notes...
]
```

### Step 2: Refresh the browser

✅ **Result**: 
- Updated note content appears immediately
- No need to recreate or delete
- **No code changes required!**

---

## Example 7: Bulk Update - Merge Two Categories

Want to merge "Kubernetes" and "Docker" notes?

### Step 1: Edit data.json

Move all Kubernetes notes into Docker and remove Kubernetes:

```json
{
  "Docker": [
    ...all Docker notes...,
    {
      "q": "What is a Pod?",
      "a": "The smallest deployable unit in Kubernetes, may contain one or more containers."
    },
    {
      "q": "What is a Deployment?",
      "a": "A higher-level API that manages ReplicaSets to provide declarative updates for Pods."
    },
    ...rest of Kubernetes notes...
  ],
  "Terraform": [...],
  "SRE": [...]
}
```

### Step 2: Refresh the browser

✅ **Result**: 
- Only Docker, Terraform, and SRE appear in sidebar
- Docker count is now 6 (3 original + 3 from Kubernetes)
- Kubernetes category is gone
- **No code changes required!**

---

## Data.json Structure Reference

```json
{
  "CategoryName": [
    {
      "q": "Question text here?",
      "a": "Answer text here."
    },
    {
      "q": "Another question?",
      "a": "Another answer."
    }
  ],
  "AnotherCategory": [
    ...more notes...
  ]
}
```

**Rules**:
- Each category is a key in the JSON object
- Each category contains an array of note objects
- Each note has exactly two properties: "q" and "a"
- Note: The app automatically maintains proper JSON format when you add notes through the UI

---

## Quick Tips

1. **Always keep data.json valid JSON** - Use a JSON validator if unsure
2. **Category names become button labels** - Use readable names
3. **Changes take effect on page refresh** - No server restart needed
4. **Use the "+ Add Note" button** - For adding notes through the UI (they're saved to localStorage)
5. **Test with test.html** - Bypasses Firebase auth if you just want to test

---

## Advanced Use Case: Syncing with Database

The app supports saving to a backend server (`/api/notes`). If you want to:
1. Load notes from a database on startup
2. Save note changes to a database
3. Share notes across devices

You can modify the `loadDataFromJSON()` and `saveData()` functions to connect to your backend.

---

**That's it! The application is now fully data-driven and easy to maintain!** 🚀
