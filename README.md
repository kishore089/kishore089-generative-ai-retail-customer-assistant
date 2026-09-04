Generative AI Retail Customer Assistant

An AI-powered retail customer support and contact-center application built on AWS. The solution provides a unified web and voice experience for customers and support administrators, combining Generative AI, Retrieval-Augmented Generation (RAG), serverless backend services, authentication, and cloud contact-center capabilities.

Architecture

The following diagram shows the overall AWS architecture and the flow between the web application, voice/contact-center layer, Amazon Bedrock AI layer, knowledge base, backend services, and operational data.



High-Level Flow

Web Customer / Admin
        |
        v
React + Vite Frontend
        |
        +---------------------> Amazon Cognito
        |
        v
Amazon API Gateway
        |
        v
AWS Lambda Backend
        |
        v
Amazon DynamoDB
        |
        +----------------------------------+
                                           |
Voice Customer                             |
    |                                      |
    v                                      |
Amazon Connect                             |
    |                                      |
    v                                      |
Amazon Lex V2                              |
    |                                      |
    v                                      |
RetailConnectBridge Lambda <---------------+
    |
    v
Amazon Bedrock Agent
    |
    +---- Agent Memory
    +---- Agent Action Groups
    +---- Bedrock Guardrails
    |
    v
Amazon Bedrock Knowledge Base
    |
    +---- Titan Text Embeddings V2
    |
    v
Amazon S3 Vectors

Key Features

Customer authentication with Amazon Cognito

Automatic customer identification using the authenticated customer's email

Customer profile management and lookup

Product search and product information

Inventory lookup

Order status and order management

Payment information and payment-method support

Return and exchange support

Support-ticket lookup

AI-powered retail customer assistance

Retrieval-Augmented Generation (RAG)

Conversational context through Bedrock Agent Memory

Bedrock Agent Action Groups for backend operations

Bedrock Guardrails for AI response controls

Voice-based customer support using Amazon Connect and Amazon Lex V2

Human-agent escalation flow

Serverless REST/HTTP APIs

DynamoDB-based operational data storage

CI/CD-style frontend deployment through AWS Amplify

AWS Services Used

1. Amazon Bedrock

Used as the Generative AI foundation of the application.

Amazon Bedrock Agent

The Bedrock Agent acts as the AI assistant's reasoning and orchestration layer. It interprets customer requests and determines whether to retrieve knowledge or invoke backend actions.

Agent Memory

Maintains relevant conversation context so the assistant can provide more consistent responses during an interaction.

Agent Action Groups

Connects the Bedrock Agent with backend Lambda functions for operations such as:

Customer lookup

Product lookup

Inventory lookup

Payment lookup

Return lookup

Support-ticket lookup

Other retail utilities

Amazon Bedrock Guardrails

Provides controls for AI-generated responses, including content and data protection policies.

2. Amazon Bedrock Knowledge Bases

Used to implement Retrieval-Augmented Generation (RAG).

Retail documents are stored in Amazon S3 and indexed through the Bedrock Knowledge Base. Relevant information can then be retrieved and supplied to the Bedrock Agent before generating a response.

RAG Flow

Retail Documents
       |
       v
Amazon S3
       |
       v
Amazon Bedrock Knowledge Base
       |
       v
Titan Text Embeddings V2
       |
       v
Amazon S3 Vectors
       |
       v
Retrieved Context
       |
       v
Amazon Bedrock Agent

3. Amazon S3

Used to store retail documents used by the Bedrock Knowledge Base.

4. Amazon S3 Vectors

Used as the vector store for embeddings generated for the knowledge-base documents.

5. Amazon Titan Text Embeddings V2

Used to generate vector embeddings for retail documents so that semantically relevant information can be retrieved through the Knowledge Base.

6. Amazon Connect

Used as the cloud contact-center and voice interaction layer.

The solution includes:

Incoming customer calls

Contact flows

Queues

Routing profiles

Quick Connect

Hours of operation

AI-assisted responses

Human-agent escalation

7. Amazon Lex V2

Used for conversational interaction and voice/chat intent handling.

Bot:

RetailShoppingAssistant

Example intents include:

ExpressDelivery
CancelOrder
ExchangePolicy
CustomerProfile
PaymentMethods
ProductSearch
ContactSupport
OrderStatus
ShippingPolicy
ShippingCost
StoreLocation
FallbackIntent
BusinessHours
Offers
DeliveryTime
Exit
ReturnPolicy
Warranty
Greeting
LiveAgent

8. AWS Lambda

Lambda provides the serverless backend and connects the application's APIs, Bedrock Agent Action Groups, and Amazon Connect integration.

Retail Backend Lambda Functions

User Login Lambda

Customer Lookup Lambda

Product Lookup Lambda

Inventory Lookup Lambda

Payment Lookup Lambda

Return Lookup Lambda

Support Ticket Lookup Lambda

Other Utility Lambda

RetailConnectBridge Lambda

Acts as the integration bridge between Amazon Connect/Lex and the Amazon Bedrock Agent.

Escalation Lambda

Handles escalation from AI-assisted conversations to a human support agent when required.

9. Amazon API Gateway

Provides the API layer between the React frontend and the serverless backend Lambda functions.

Example API areas include:

/customer
/products
/orders
/inventory
/payments
/returns
/support
/analytics
/lex

10. Amazon DynamoDB

Used for operational retail data.

The solution contains tables for:

Customers
Products
Orders
Inventory
Payments
Returns
SupportTickets

11. Amazon Cognito

Used for customer authentication and account management.

Authentication Flow

Customer
   |
   v
React Frontend
   |
   v
Amazon Cognito
   |
   v
Authenticated User
   |
   v
Customer Identification
   |
   v
Customer Dashboard

Customer credentials are managed by Cognito rather than being stored in DynamoDB.

12. AWS Amplify

Used to host and deploy the React + Vite frontend.

The GitHub repository is connected to Amplify so that the application can be built and deployed from the main branch.

Amplify Build Configuration

Build command:
npm run build

Build output directory:
dist

Deployment flow:

GitHub
   |
   v
AWS Amplify
   |
   v
npm install
   |
   v
npm run build
   |
   v
dist/
   |
   v
Amplify Hosting

Frontend Technology Stack

The web application is built using:

React

TypeScript

Vite

React Router

Tailwind CSS

HeroUI

Axios

AWS Amplify

Amazon Cognito

Frontend Structure

src/
├── assets/
├── components/
├── config/
├── contexts/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── styles/
├── types/
├── utils/
├── App.tsx
├── index.css
└── main.tsx

Prerequisites

Install the following before running the project locally:

Node.js 20+ recommended

npm

Git

An AWS account with access to the required AWS resources

Verify the installations:

node --version
npm --version
git --version

Installation

Clone the repository:

git clone https://github.com/kishore089/kishore089-generative-ai-retail-customer-assistant.git

Navigate to the project:

cd kishore089-generative-ai-retail-customer-assistant

Install all frontend dependencies:

npm install

npm install reads package.json and installs the required React, TypeScript, Vite, AWS Amplify, Axios, UI, routing, and development dependencies.

Environment Variables

Create a .env file in the project root.

VITE_API_BASE_URL=https://YOUR_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com/prod
VITE_LEX_API_URL=https://YOUR_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com/prod/lex

VITE_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID
VITE_COGNITO_REGION=us-east-1

The .env file should never be committed to GitHub.

Use .env.example to document the required variables.

Run the Application Locally

Start the Vite development server:

npm run dev

The application will normally be available at:

http://localhost:5173

Production Build

Build the application:

npm run build

The production files are generated in:

dist/

Preview the production build:

npm run preview

Git Workflow

After making changes:

git status

Stage changes:

git add .

Commit changes:

git commit -m "Update retail assistant"

Push to GitHub:

git push origin main

When connected to AWS Amplify, pushing changes to the configured branch can trigger a new frontend deployment.

Application Interaction Flows

Web Customer Flow

Customer
   |
   v
React + Vite
   |
   v
Amazon Cognito
   |
   v
Automatic Customer Identification
   |
   v
Customer Dashboard
   |
   v
Amazon API Gateway
   |
   v
AWS Lambda
   |
   v
Amazon DynamoDB

AI Assistant Flow

Customer Request
      |
      v
React AI Assistant / Voice Interaction
      |
      v
Amazon Bedrock Agent
      |
      +---- Knowledge Base / RAG
      |
      +---- Agent Action Groups
      |
      +---- Agent Memory
      |
      +---- Bedrock Guardrails
      |
      v
AI Response

Voice Flow

Incoming Customer Call
        |
        v
Amazon Connect
        |
        v
Amazon Lex V2
        |
        v
RetailConnectBridge Lambda
        |
        v
Amazon Bedrock Agent
        |
        +---- Backend Lambda Actions
        |
        +---- Knowledge Base
        |
        v
AI Response
        |
        +---- Customer Resolution
        |
        └---- Human Agent Escalation

Security

The application uses Amazon Cognito for authentication and AWS managed services for the backend.

Recommended production practices include:

Keep .env files out of source control

Never commit AWS access keys or secret credentials

Use IAM roles and least-privilege permissions

Protect API Gateway endpoints with Cognito authorization

Apply appropriate CORS policies

Restrict S3 and DynamoDB access

Use Bedrock Guardrails for AI safety

Enable CloudWatch logging and monitoring

Use HTTPS for production traffic

Future Enhancements

The architecture can be extended with:

Amazon Connect Contact Lens for advanced conversation analytics

Amazon CloudWatch for centralized monitoring and logs

AWS IAM for more granular access control

Amazon SNS / Amazon SES for notifications

Advanced customer analytics

Additional AI-powered retail workflows

Improved human-agent handoff

Production-grade API authorization

Additional monitoring and observability

Project Objective

The goal of this project is to demonstrate how Generative AI, RAG, serverless computing, authentication, and cloud contact-center services can be combined to build an intelligent retail customer-support platform.

The solution brings together:

Web + Voice + Generative AI + RAG + Customer Data + Serverless Backend + Contact Center

Technology Summary

Layer

Technologies

Frontend

React, TypeScript, Vite

UI

Tailwind CSS, HeroUI

Routing

React Router

HTTP Client

Axios

Authentication

Amazon Cognito

AI

Amazon Bedrock

AI Agent

Amazon Bedrock Agents

AI Memory

Bedrock Agent Memory

AI Tools

Bedrock Agent Action Groups

AI Safety

Bedrock Guardrails

RAG

Amazon Bedrock Knowledge Bases

Embeddings

Amazon Titan Text Embeddings V2

Vector Store

Amazon S3 Vectors

Documents

Amazon S3

Voice Contact Center

Amazon Connect

Conversational AI

Amazon Lex V2

Backend

AWS Lambda

API

Amazon API Gateway

Database

Amazon DynamoDB

Hosting

AWS Amplify

Source Control

GitHub

Repository

GitHub:

https://github.com/kishore089/kishore089-generative-ai-retail-customer-assistant

License

This project is intended for educational, internship, demonstration, and proof-of-concept purposes.
