# Security Risk Assessment

## Overview
The **AI-Based Image Caption Generator** uses Supabase for authentication and user management. The media data such as images and metadata are stored locally in the database. Each user’s media/images is secured through authentication in order to prevent cross-user access.  

In this document, we identify key security risks, their priorities, and mitigation strategies for the 
current implementation.

---

## Identified Security Risks

### 1. Data Exposure of Images and Metadata
**Priority:** High  

User images or captions could be exposed if storage settings or database permissions are not set up correctly/properly.  
If Row-Level Security isn’t enforced, one user might see or access another user’s files which means it would break privacy rules.

**Mitigation:**
- Turn on **Supabase Row-Level Security (RLS)** to keep each user’s data private.  
- Use **temporary signed links** for accessing images.  
- Keep all data **encrypted** when stored and when sent over the internet.
- Use your existing **API mapping logic** to make sure each image is linked to the correct user account, so no one can access another person’s files.

---

### 2. Unsafe File Upload and Processing
**Priority:** High  

Attackers could upload harmful or very large files that might crash the server or take advantage of weak image tools.

**Mitigation:**
- Allow only safe **file types and sizes** for upload.  
- **Re-save images** on the server and remove extra data.   
- Handle uploads in **secure, separate environments** with limited access and resources.

---

### 3. Credential and OAuth Token Handling
**Priority:** High  

If Supabase or social login keys are exposed in public code, attackers could break into the system.

**Mitigation:**
- Keep all keys and passwords in **secure server settings**, not in the client code.  
- **Change and update** keys and tokens regularly to reduce risk.

---

### 4. Web Application Vulnerabilities
**Priority:** Medium  

If the app doesn’t properly clean or check what users type in, hackers could add harmful code to the site **(XSS)** that changes what people see or could potentially steal their information.

**Mitigation:**
- Clean and check all user input and output before showing it on the site.
- Regularly test and review user permissions and data access rules to make sure they’re correct.

---

### 5. Model Safety and Abuse
**Priority:** Medium  

Since the app uses an **AI wrapper** (not a custom-built model), there is still a chance that the AI could create **inappropriate, offensive, or biased** captions if filters and controls aren’t applied correctly.

**Mitigation:**
- Add **filters** to block harmful or unsafe captions before showing them to users.  
- Limit tone and style options to **safe, appropriate categories**.  
- Allow users to **report and flag** any captions that seem inappropriate, so they can be reviewed or filtered.

---

### 6. Compliance and Data Retention (if implementing image storage)
**Priority:** Low–Medium  

If image storage is added, not having clear consent or data storage rules could break privacy laws and make users lose trust.

**Mitigation:**
- Set clear **time limits** for how long images and data are kept (like 30–90 days).  
- Let users **download or delete** their data whenever they want.  
- Clearly explain **privacy and consent** terms inside the app.

---

## Conclusion
The current system’s primary risks center on **data exposure**, **upload handling**, and **credential management** which are all rated high priority.  
This document aims to improve security and maintain user trust, therefore some of these mitigation strategies could be applied.
