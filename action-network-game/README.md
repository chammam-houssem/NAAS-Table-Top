# Relational Action Network Game

A web-based interactive game for mapping and documenting administrative processes, services, and actions through a dynamic node-based network. Players create interconnected "action boxes" (nodes) representing services like "get fishing permit," populating them with structured metadata about authorization, digital accessibility, regulations, and real-world case studies.

## Features

- **Interactive Node Creation**: Create action nodes with comprehensive metadata including authority, digital accessibility, PPP roles, regulations, and case studies
- **Dynamic Network Visualization**: Force-directed graph layout with smooth animations and drag-and-drop functionality
- **Relationship Mapping**: Create links between actions with configurable relationship types (requires, enables, conflicts with, etc.)
- **Confidence-Based Linking**: Only nodes with 30%+ confidence can create links, encouraging thorough data collection
- **Arena Expansion**: Play area automatically expands when more than 6 links are created
- **Data Persistence**: Auto-save to localStorage with manual export/import functionality
- **Zoom & Pan**: Navigate large networks with intuitive zoom and pan controls

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd action-network-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## How to Play

1. **Configure Relationship Types**: When you first start, define the types of relationships that can exist between actions (e.g., "requires", "enables", "conflicts with")

2. **Create Your First Action**: Click anywhere on the canvas to create your first action node

3. **Fill Out Metadata**: Click on a node to open the metadata form. Fill in:
   - Action name (required)
   - Authority (required)
   - Digital accessibility level
   - Public-private partnership role
   - Relevant regulations
   - Case studies
   - Confidence level (0-100%)

4. **Create Links**: Right-click on a node with 30%+ confidence to start creating links to other actions

5. **Watch the Arena Expand**: When you create more than 6 links, the play area automatically expands

6. **Save Your Work**: Use the toolbar to export your network as JSON or import previously saved games

## Technical Details

### Tech Stack

- **Frontend**: React 18 with TypeScript
- **Visualization**: D3.js for force-directed graph layout
- **Styling**: CSS with modern design principles
- **Build Tool**: Vite
- **State Management**: React Context + useReducer

### Data Model

Each action node contains:
- Basic info (name, position, timestamps)
- Authority information
- Digital accessibility level
- Public-private partnership details
- Regulatory framework references
- Case studies and examples
- Confidence level (0-100%)

### Persistence

- **Development**: localStorage for browser-based persistence
- **Export/Import**: JSON format for data portability
- **Auto-save**: Debounced saving every 2 seconds

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for educational and research purposes in civic technology
- Inspired by the need to visualize complex administrative processes
- Uses D3.js for powerful data visualization capabilities
