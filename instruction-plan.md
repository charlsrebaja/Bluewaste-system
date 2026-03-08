Act as a senior software architect, full-stack developer, mobile developer, UI/UX designer professional, and GIS engineer.

Design and generate a **complete smart waste management platform called "BlueWaste"** that supports **both Web Application and Mobile Application in one unified system** with a **shared backend and centralized database**.

# System Goal:
BlueWaste is a smart environmental platform that allows **citizens to report waste problems** and enables **LGU administrators to monitor, analyze, and manage waste reports using maps, analytics, and dashboards**.

Architecture Requirements:

* One centralized backend API
* Shared database for web and mobile
* Real-time synchronization between platforms
* Scalable and modular system architecture

# Technology Stack:
## Frontend Web:

*  Next.js, Prisma ORM, NeonDb for database management,
* TailwindCSS + Shadcn UI for styling
* Chart.js for analytics
* Leaflet.js for interactive maps
* React Query for data fetching and caching
* React Hook Form for form handling
* React Native for mobile app development
* Expo for mobile app development and deployment
* Cloudinary for image storage and management
* JWT for authentication, later can be switched to google authentication


## Mobile App:

* React Native with Expo

## Backend:

* Node.js with Express
* RESTful API design
* JWT for authentication
* Prisma ORM for database management

## Database:

* PostgreSQL 
* NeonDb for cloud-hosted PostgreSQL database
* Database schema design for waste reports, users, and analytics
* ERD (Entity-Relationship Diagram) for database structure
* SQL table creation queries for all necessary tables and relationships
* Database indexing for performance optimization
* Data migration strategy for future updates and changes
* Backup and recovery plan for database management
* Database security measures, including encryption and access control
* Database query optimization for performance

## Storage:

* Cloudinary for image uploads

## Maps & GIS:

* Leaflet.js

# .env Configuration:
```# Database
# DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_PIcYSj70gnKD@ep-frosty-bird-a1frixlu.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
# JWT
JWT_SECRET=your_jwt_secret_key
# Cloudinary
CLOUDINARY_CLOUD_NAME=drrtvz6sl
CLOUDINARY_API_KEY=885711723653981
CLOUDINARY_API_SECRET=cxSJ9P9yv_KX-Wl0uB5131g6Cg0
```
# gitignore
```# Node modules
node_modules/
# Environment variables
.env
# Build output
dist/
# Logs
logs/
# Database files (if any)
*.db
# Cloudinary uploads (if stored locally before upload)
uploads/
# IDE files
.vscode/
.idea/
# OS files
.DS_Store
# Mobile app build files
android/
ios/
```

# Core Modules:

# 1. Citizen Reporting System (Web & Mobile)

* User registration and login
* Anonymous waste reporting
* Upload waste images
* Select location via interactive map and GPS auto-detection
* Choose waste category
* Submit report
* View and track submitted reports
* Receive report status updates
* Report history and analytics for citizens

# 2. LGU Admin Dashboard (Web)

* Dashboard statistics
* Total reports
* Pending / Verified / Cleanup Scheduled / Cleaned / Rejected reports
* Waste hotspots
* Manage reports
* Update report status
* Assign cleanup teams
* Activity logs
* Waste analytics charts

# 3. LGU Staff / Field Workers (Mobile)

* Mobile app for field workers
* Verify reports on site
* View assigned cleanup tasks
* Mark reports as completed or in progress
* Upload cleanup photos
* Real-time updates to dashboard when status changes
* Receive notifications for new assignments and report updates
* View waste heatmap to identify hotspots during cleanup operations


# 4. Smart Waste Map

* Map view for Panabo City showing all waste reports
* Filter reports by status, category, and date
* Clustered markers for high-density areas
* Heatmap layer showing waste report intensity
* Popup details with report information and images
* Map legend explaining marker colors and heatmap intensity
* Real-time updates on the map when new reports are submitted or status changes
* Map-based report submission for citizens to easily report waste issues by clicking on the map
* Map-based report management for LGU admins to update report status directly from the map interface
* Mobile map view for field workers to navigate to report locations and update status on the go
* Map-based analytics for LGU admins to visualize waste report trends and hotspots over time
* Map-based notifications for citizens and field workers to receive real-time updates on report status changes and new reports in their area
* Use leaflet.js for interactive map features, including marker clustering and heatmap layers
* Interactive map displaying waste reports
* Animated markers for new reports
* Waste heatmap showing report intensity
* Barangay boundary filtering
* Popup showing report details and images

# 5. Barangay Monitoring System

* List all barangays at Panabo City with exact coordinates
* Waste report statistics per barangay
* Ranking of most polluted barangays
* Heatmap density per barangay

# 6. Analytics & Reports

* Daily, weekly, monthly report trends
* Waste category distribution
* Barangay waste statistics
* Data visualization charts
* Export reports

# 7. Real-Time Notifications

* Notify LGU when a new report is submitted
* Notify citizens when report status changes
* Notify field workers of new assignments
* Notification badges in dashboard and mobile app

# 8. Media & Image Management

* Upload waste images
* Validate file type and size
* Store images in Cloudinary
* Link images to reports

# 9. Security

* Secure authentication
* Role-based access (Citizen, LGU Admin ,Field Worker)
* Input validation
* Protection against SQL injection
* Secure file uploads

# 10. Performance & Scalability

* Optimized database queries
* Pagination and filtering
* API rate limiting
* Modular folder structure

Deliverables:
Generate the following:

1. Full system architecture diagram
2. Database schema and ERD
3. SQL table creation queries
4. Backend API endpoints
5. Folder structure for Web, Mobile, and Backend
6. Authentication flow
7. Example frontend UI pages
8. Waste heatmap implementation
9. Map marker clustering
10. Deployment strategy
11. Testing strategy
12. Maintenance plan


Ensure the platform is **production-ready, scalable, and suitable for government-level environmental monitoring systems**.
