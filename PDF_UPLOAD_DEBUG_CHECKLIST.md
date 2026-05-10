# QuizMind AI PDF Upload Debugging Checklist

## 🔍 Tomorrow Debugging Steps

### 1. Verify Component Rendering
**File:** `app/professor/create-quiz/page.tsx`
- [ ] Open the create-quiz page
- [ ] Check browser Console for: `🔥 AIQuizGenerator component rendered!`
- [ ] Verify the upload UI is visible
- [ ] Confirm the file input element exists

### 2. Test File Input onChange Event
**Expected Console Logs:**
```
🔥 handleFileSelect() called!
📁 Event target: [HTMLInputElement]
📋 Files: [FileList]
📄 Selected file: [File object]
📋 File details: {name, type, size, lastModified}
✅ Valid PDF file selected
🚀 Auto-triggering generateQuizSets()
```

**Steps:**
- [ ] Enter a quiz title (required for auto-generation)
- [ ] Click "Upload PDF" button
- [ ] Select a PDF file
- [ ] Check browser Console for the logs above
- [ ] Verify file validation works (PDF type check)

### 3. Verify fetch() Request Triggering
**Expected Console Logs:**
```
🚀 generateQuizSets() called!
📝 Syllabus text length: 0
📄 Selected file: your-file.pdf
📋 Quiz title: Your Quiz Title
✅ All validations passed, starting generation...
📦 Creating FormData...
📄 File added to FormData: your-file.pdf
📤 FormData contents:
  syllabusText: 
  count: 5
  file: your-file.pdf (size bytes)
🌐 Sending fetch request to /api/ai/generate-quiz-sets
📥 Response received: 200 OK
```

**Network Tab Verification:**
- [ ] Open F12 → Network tab
- [ ] Filter by "Fetch/XHR"
- [ ] Select PDF file
- [ ] Should see POST request to `/api/ai/generate-quiz-sets`
- [ ] Check request payload contains FormData
- [ ] Verify response status (200 OK expected)

### 4. Test Different Scenarios

#### Scenario A: No Console Logs
**Problem:** Component/rendering issue
**Debug Steps:**
- [ ] Check if AIQuizGenerator is actually rendered
- [ ] Verify React component mounting
- [ ] Check for JavaScript errors in Console
- [ ] Verify file input element exists in DOM

#### Scenario B: Logs Appear, No Network Request
**Problem:** fetch() logic issue
**Debug Steps:**
- [ ] Check generateQuizSets() function execution
- [ ] Verify FormData creation
- [ ] Check fetch() call parameters
- [ ] Look for JavaScript errors after "🌐 Sending fetch request"

#### Scenario C: Network Request Appears but Fails
**Problem:** Backend/API issue
**Debug Steps:**
- [ ] Check response status code
- [ ] Verify API endpoint exists: `/api/ai/generate-quiz-sets`
- [ ] Check API route for errors
- [ ] Verify pdfjs-dist dependency is installed
- [ ] Check server logs for PDF processing errors

### 5. File Input Connection Verification
**Expected HTML Structure:**
```html
<input
  ref={fileInputRef}
  type="file"
  accept=".pdf"
  onChange={handleFileSelect}
  className="hidden"
  disabled={isUploading}
/>
```

**Debug Steps:**
- [ ] Inspect DOM for hidden file input
- [ ] Verify onChange={handleFileSelect} is present
- [ ] Check that visible upload button triggers file input click
- [ ] Test manual file input click (if possible)

### 6. Manual fetch() Test (Console)
If automatic triggering fails, test manually:
```javascript
// Paste in browser Console after selecting a file
const file = document.querySelector('input[type="file"]').files[0];
const formData = new FormData();
formData.append('syllabusText', '');
formData.append('count', '5');
formData.append('file', file);

fetch('/api/ai/generate-quiz-sets', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(console.log);
```

### 7. Backend Verification
**API Route:** `app/api/ai/generate-quiz-sets/route.ts`
- [ ] Verify file exists at correct path
- [ ] Check for TypeScript errors
- [ ] Verify pdfjs-dist import works
- [ ] Test PDF extraction function
- [ ] Check AI API key configuration

### 8. Dependencies Check
**Package.json:**
- [ ] Verify `pdfjs-dist: "^4.8.69"` is installed
- [ ] Run `npm install` if needed
- [ ] Check for any dependency conflicts

### 9. Browser Compatibility
- [ ] Test in Chrome/Chromium
- [ ] Test in Firefox
- [ ] Check for browser-specific issues
- [ ] Verify FileReader API support

### 10. Error Scenarios
**Test these error cases:**
- [ ] Select non-PDF file (should show error toast)
- [ ] Select PDF larger than 50MB (should show size error)
- [ ] Select PDF without quiz title (should show title required)
- [ ] Network offline (should show network error)

## 🚀 Expected Success Flow

1. **Page Load:** `🔥 AIQuizGenerator component rendered!`
2. **File Selection:** `🔥 handleFileSelect() called!` → `✅ Valid PDF file selected`
3. **Generation Start:** `🚀 generateQuizSets() called!` → `🌐 Sending fetch request`
4. **Network Request:** POST to `/api/ai/generate-quiz-sets` visible in Network tab
5. **Response:** `📥 Response received: 200 OK` → `✅ Response data: {quizSets: {...}}`
6. **UI Update:** Success toast, quiz sets displayed, save button appears

## 🐛 Common Issues & Solutions

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| No console logs | Component not rendered | Check page.tsx imports |
| onChange not firing | File input disconnected | Verify ref and onChange binding |
| No network request | Validation failed | Check quiz title requirement |
| 404 error | API route missing | Verify file path |
| 500 error | Backend error | Check server logs |
| PDF processing error | pdfjs-dist issue | Verify dependency installation |

## 📋 Quick Test Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Check TypeScript errors
npm run build

# Check for linting issues
npm run lint
```

## ✅ Success Criteria

- [ ] Console shows all expected logs
- [ ] Network tab shows POST request to `/api/ai/generate-quiz-sets`
- [ ] Response status is 200 OK
- [ ] Quiz sets are generated and displayed
- [ ] Save functionality works
- [ ] No JavaScript errors in Console

## 🔄 After Fix

```bash
git add .
git commit -m "Fixed PDF upload flow - added comprehensive debugging and fixed onChange event handling"
git push origin main
```

---

**Debugging Priority:**
1. Component rendering (Console logs)
2. Event handling (onChange firing)
3. Network request (fetch execution)
4. Backend processing (API response)
5. UI updates (success/error display)
