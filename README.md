# AI Resource Allocation Configurator

A Next.js application that uses AI to help configure and manage resource allocation systems. The application leverages Hugging Face LLM API for intelligent data processing, column mapping, natural language search, and business rule generation.

## Features

- **AI-Powered Column Mapping**: Automatically maps CSV/Excel headers to standardized field names
- **Natural Language Search**: Search through clients, workers, and tasks using natural language queries
- **Data Validation & Corrections**: AI-assisted data validation and automatic correction suggestions
- **Business Rule Generation**: Convert natural language descriptions into business rules
- **Rule Recommendations**: Get AI-powered suggestions for business rules based on data patterns
- **Data Export**: Export configured data and rules as packages

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **AI Integration**: Hugging Face LLM API
- **Data Processing**: PapaParse, XLSX
- **State Management**: Zustand
- **Data Tables**: TanStack Table

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Hugging Face API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AI_Resource_Allocation_Configurator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HUGGINGFACE_MODEL=meta-llama/Llama-2-7b-chat-hf
```

### Getting a Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Create an account or sign in
3. Go to your profile settings
4. Navigate to "Access Tokens"
5. Create a new token with appropriate permissions
6. Copy the token to your `.env.local` file

### Available Models

The application uses Hugging Face's inference API. You can configure different models by setting the `HUGGINGFACE_MODEL` environment variable. Some recommended models:

- `meta-llama/Llama-2-7b-chat-hf` (default)
- `microsoft/DialoGPT-medium`
- `gpt2`
- `EleutherAI/gpt-neo-125M`

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### 1. Upload Data
- Upload CSV or Excel files containing client, worker, and task data
- The AI will automatically map column headers to standardized field names

### 2. Validate Data
- Review and validate the uploaded data
- Get AI-powered suggestions for data corrections

### 3. Configure Business Rules
- Use natural language to describe business rules
- Get AI-generated rule recommendations based on your data

### 4. Search and Filter
- Use natural language to search through your data
- Filter by various criteria using AI-powered search

### 5. Export Configuration
- Export your complete configuration as a package
- Includes all data, rules, and settings

## API Endpoints

### AI Services
- `POST /api/ai/column-mapping` - Map CSV headers to standardized fields
- `POST /api/ai/natural-language-search` - Search data using natural language
- `POST /api/ai/data-corrections` - Generate data correction suggestions

### Business Rules
- `POST /api/rules/generate-rules` - Generate business rules from descriptions
- `POST /api/rules/rule-recommendations` - Get AI-powered rule recommendations

### Export
- `POST /api/export/export-package` - Export complete configuration

## Data Schema

### Clients
- `ClientID` (required): Unique identifier
- `ClientName` (required): Client name
- `PriorityLevel` (required): Priority 1-5
- `RequestedTaskIDs`: Comma-separated task IDs
- `GroupTag`: Group classification
- `ContactEmail`: Email address
- `ContactPhone`: Phone number
- `Budget`: Budget amount
- `Deadline`: Deadline date

### Workers
- `WorkerID` (required): Unique identifier
- `WorkerName` (required): Worker name
- `Skills`: Comma-separated skills
- `AvailableSlots`: Array of phase numbers
- `MaxLoadPerPhase`: Maximum load per phase
- `WorkerGroup`: Group classification
- `QualificationLevel`: Qualification level
- `HourlyRate`: Hourly rate
- `Location`: Location

### Tasks
- `TaskID` (required): Unique identifier
- `TaskName` (required): Task name
- `Category`: Task category
- `Duration`: Number of phases
- `RequiredSkills`: Comma-separated required skills
- `PreferredPhases`: Preferred phase numbers
- `MaxConcurrent`: Maximum parallel assignments
- `Dependencies`: Comma-separated task dependencies
- `Priority`: Priority level
- `Cost`: Task cost

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub or contact the development team. 