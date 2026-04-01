# SaveSmart: An AI-Driven Multi-Modal Financial Management System

## Summary

SaveSmart is a full-stack web application designed to assist users in managing personal finances through intelligent analytics and multi-modal data processing. The system enables users to track, analyze, and improve financial behavior using a combination of rule-based and machine learning techniques.

The platform supports multiple input modalities, including manual entry, CSV bank statement imports, voice commands, and receipt scanning via optical character recognition (OCR). These inputs are processed through a unified pipeline to generate structured financial data and actionable insights.

## Statement of Need

Existing personal finance applications primarily rely on structured data inputs and provide limited personalization. Many systems lack support for unstructured data such as voice and images, and do not incorporate behavioral engagement mechanisms.

SaveSmart addresses these limitations by integrating multi-modal data processing, intelligent analytics, and gamification. The system provides real-time anomaly detection, automated transaction categorization, and goal-based financial planning, helping users make better financial decisions.

## Software Description

### Architecture

SaveSmart follows a modular three-tier architecture:

* Frontend: React + TypeScript (Progressive Web Application)
* Backend: Node.js + Express.js (Microservices architecture)
* Database: PostgreSQL with Redis caching

### Features

* Multi-modal input (manual, CSV, voice, OCR)
* Automated transaction categorization (hybrid rule-based + ML)
* Real-time anomaly detection using statistical methods
* Goal prediction and savings tracking
* Gamification system (points, achievements, progress tracking)

### Implementation

The system is implemented as a full-stack web application with RESTful APIs enabling communication between components. OCR functionality is implemented using Tesseract.js, while voice processing utilizes the Web Speech API.

## Availability

* Source code: https://github.com/alanjollyc/ai-financial-assistant
* License: MIT
* Platform: Web (cross-platform)

## Reproducibility

The project is modular and can be deployed locally using standard Node.js and PostgreSQL environments. The repository includes configuration files, dependencies, and setup instructions required to reproduce the system.

## Authors and Contributions

* Alan Jolly Cheeramvelil — System design, full-stack development, and implementation
* Sudev P V — Backend development and API integration
* Anandam P M — Data processing and analytical modules
* Sidharth Babu — Testing, validation, and documentation

All authors contributed to the development of the software and approved the final version of the manuscript.
