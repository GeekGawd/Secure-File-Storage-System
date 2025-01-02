# Secure File Storage System

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Security Considerations](#security-considerations)

## Tech Stack
- Frontend
  - React.js
  - Vite
  - Redux Toolkit
  - RTK Query
  - Tailwind CSS
  - Shadcn UI Components
- Backend
  - Django
- Infrastructure
  - Docker
  - HTTPS/SSL

## Features
- Secure File Upload/Download
- User Authentication
- Two-Factor Authentication (2FA) with TOTP
- File Encryption
- Real-time Updates
- Responsive UI

## Security Considerations

To ensure that the file is safely stored, as well as can be easily shared with other users, I have implemented the Envelope Encryption technique. 

The flow for uploading a file is as follows:

![Upload Flow](/images/UploadFlow.png "Title")

The flow for downloading/viewing a file is as follows:

![Download Flow](/images/DownstreamFlow.png "Title")


The idea to decrypt the dek on server side is to ensure that the derypted dek should not be shared with the user. 

- The data is encrypted at REST as I am using HTTPS. I am also, ensuring CORS is enabled on the APIs.

- The API's are throttled to prevent abuse and to protect the server from being overwhelmed by DDoS attacks.

- For RBAC

- Admin: Django already has a built in admin panel.
- User: User can upload files and download files.

