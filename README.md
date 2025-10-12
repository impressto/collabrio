# Collabrio - Real-time Collaborative Text Editor

**Version:** 2.2 | **Status:** Production Ready | **Updated:** October 11, 2025

![collabrio_screen](https://github.com/user-attachments/assets/f5d57667-f52c-49f1-b071-6b7c391e76df)

## 🎯 Quick Start

**Collabrio** is an anonymous collaborative text editor designed for educational environments. Students can collaborate on documents in real-time with fun interactive features.

### Key Features
- 📝 **Anonymous Collaboration** - No signup required, share via URL/QR code
- 🎵 **Shared Audio System** - 25+ reaction sounds with floating icon animations  
- 🏫 **School Authentication** - Restricted access to authorized educational institutions
- 📱 **Mobile Friendly** - Responsive design works on all devices
- 🌙 **Dark/Light Themes** - Student preference support
- ⚡ **Real-time Sync** - WebSocket with P2P fallback

Designed for classroom collaboration where students need:
- Quick session creation without accounts
- Fun, engaging audio feedback  
- Mobile-friendly interface for BYOD environments
- Teacher control through school authentication
- Anonymous participation to reduce social pressure

## � Installation & Setup

```bash
# Clone repository  
git clone [repository-url]
cd collabrio

# Install dependencies
npm install
cd client && npm install && cd ..

# Development mode
npm run dev          # Starts both client and socket server
# OR
cd client && npm run dev     # Client only (port 5173)
cd socket-server && npm run dev  # Socket server only (port 3001)

# Production build
npm run build        # Builds client to dist/
```

## 🔧 Configuration

**Environment Variables** (client/.env):
```bash
VITE_SOCKET_SERVER_URL=wss://your-socket-server.com
VITE_BASE_URL=https://your-app-domain.com
VITE_DEBUG=false
```

**School Numbers** (for authentication):
- Earl of March: `906484`
- Bell High School: `894362`

## 📚 Documentation Structure

- **README.md** (this file) - Quick start and overview
- **ARCHITECTURE.md** - Technical system overview  
- **USER_STORIES.md** - Current features and acceptance criteria
- **adr/** - Architecture Decision Records (industry-standard decision documentation)
- **archive/** - Detailed historical documentation

## 🔗 Quick Links

- **Socket Admin:** `/socket-server/admin.html`
- **Test Pages:** Various test-*.html files for feature validation  
- **Archive Docs:** `/docs/archive/` for detailed project history

---

**Need Help?** Check `ARCHITECTURE.md` for technical details or `USER_STORIES.md` for feature specifications.
- Node.js 18+ 
- Yarn package manager
- Modern web browser

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collabrio
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   cd client
   yarn install
   
   # Backend dependencies  
   cd ../socket-server
   npm install
   ```

3. **Configure environment (optional)**
   ```bash
   # Copy example environment file
   cd client
   cp .env.example .env
   
   # Edit .env to customize settings
   # VITE_SOCKET_SERVER_URL=http://localhost:3000
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start WebSocket server
   cd socket-server
   npm run dev
   
   # Terminal 2: Start frontend dev server
   cd client  
   yarn dev
   ```

5. **Open application**
   - Navigate to `http://localhost:5174`
   - Create a session and share with others to test collaboration

### Production Deployment

```bash
# Build frontend
cd client
yarn build

# Start production server
cd ../socket-server
npm start
```

## 📚 Learning from This Project

### Specification-Driven Development Process

This project demonstrates the complete cycle of specification-driven development:

1. **📋 Requirements Gathering** - Understanding user needs and constraints
2. **📝 Specification Writing** - Translating needs into clear, testable requirements  
3. **🏗️ Architecture Design** - Planning technical approach based on requirements
4. **💻 Implementation** - Building features according to specifications
5. **🧠 Decision Documentation** - Capturing choices and lessons learned
6. **🔄 Iteration** - Refining specifications based on implementation learnings

### Key Documentation Patterns

#### User Story Structure
```markdown
**As a [user type]**, I want [goal] so that [benefit].

**Acceptance Criteria:**
- [ ] Specific, testable requirement
- [ ] Another measurable outcome
- [ ] Edge case handling

**Definition of Done:** Clear completion criteria
```

#### Decision Documentation Format  
```markdown
**Context:** Why was this decision needed?
**Options Considered:** What alternatives were evaluated?
**Decision:** What was chosen and why?
**Outcome:** What actually happened?
**Lessons Learned:** What would we do differently?
```

### Real-World Development Insights

The memory document captures authentic development challenges:

- **Technology selection trade-offs** (React vs Vue, WebRTC vs WebSocket)
- **User experience decisions** (session ID length, theme system)
- **Performance optimizations** (document persistence, session cleanup)
- **Architecture evolution** (component extraction, CSS isolation)

## 🎯 Educational Objectives Met

### Primary Learning Goals

✅ **Technical Specification Writing** - Students see how to write clear, implementable requirements  
✅ **User Story Development** - Proper format and acceptance criteria structure  
✅ **Decision Documentation** - Capturing rationale and lessons for future reference  
✅ **Architecture Communication** - Documenting system design and component relationships  
✅ **Requirements Validation** - Connecting specifications to actual implementation

### Secondary Skills Developed

✅ **Project Organization** - Clean file structure and component architecture  
✅ **Environment Management** - Configuration best practices for different deployment scenarios  
✅ **User Experience Design** - Balancing functionality with simplicity  
✅ **Performance Considerations** - Real-time system constraints and optimizations  
✅ **Documentation Maintenance** - Keeping specifications current with implementation

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client A      │    │   Client B      │    │   Client C      │
│   (React App)   │    │   (React App)   │    │   (React App)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │  WebSocket      │
                        │  Server         │
                        │  (Node.js)      │
                        └─────────────────┘
```

### Key Technical Decisions

- **React Component Architecture** - Modular design for maintainability
- **WebSocket Communication** - Reliable real-time updates across browsers  
- **CSS Isolation** - Safe embedding in external websites
- **Environment Configuration** - Flexible deployment across different environments
- **Anonymous Sessions** - Privacy-first approach with shareable URLs

## 📖 Documentation Structure

### Core Documents

- **[docs/spec-document.md](docs/spec-document.md)** - Complete technical specification
  - Project overview and success criteria
  - User stories with acceptance criteria  
  - Technical architecture and requirements
  - Testing strategy and definition of done

- **[docs/memory-document.md](docs/memory-document.md)** - Decision log and lessons learned
  - Technology selection rationale
  - Architecture evolution decisions  
  - Performance optimization insights
  - User feedback integration examples

### Supporting Documentation

- **[ENV_CONFIGURATION.md](ENV_CONFIGURATION.md)** - Environment setup guide
- **[EMBEDDING_GUIDE.md](EMBEDDING_GUIDE.md)** - Integration instructions for external sites

## 🎓 Using This Project for Education

### For Instructors

1. **Assign specification analysis** - Have students review and critique the spec document
2. **Decision evaluation exercises** - Analyze decisions in memory document and propose alternatives  
3. **Implementation mapping** - Trace requirements from spec to actual code
4. **Documentation practice** - Use format as template for student projects
5. **Architecture discussion** - Examine trade-offs and design patterns

### For Students

1. **Study the specification structure** - Learn how to write clear, testable requirements
2. **Follow the decision trail** - Understand how technical choices impact implementation  
3. **Examine the architecture** - See how components relate and responsibilities are divided
4. **Test the application** - Verify that implementation matches specifications
5. **Extend the project** - Add new features using the same documentation approach

### Assessment Opportunities

- **Specification quality** - Can students write similarly clear requirements?
- **Decision documentation** - Do they capture rationale and trade-offs effectively?
- **Architecture understanding** - Can they explain system design and component relationships?
- **Implementation tracing** - Can they connect requirements to actual code?

## 🚀 Production Use

While designed for education, Collabrio is fully functional and production-ready:

- **Scalable Architecture** - Handles multiple concurrent sessions
- **Security Considerations** - CSS isolation prevents conflicts and injection
- **Performance Optimized** - Real-time updates with minimal latency
- **Mobile Friendly** - Responsive design works on all devices
- **Embedding Support** - Safe integration into existing websites

## 🤝 Contributing

This project welcomes contributions that enhance its educational value:

- **Documentation improvements** - Better examples, clearer explanations
- **Feature additions** - New capabilities that demonstrate spec-driven development
- **Bug fixes** - Issues that improve the learning experience  
- **Educational resources** - Exercises, assignments, or teaching materials

Please maintain the documentation standards demonstrated in the existing spec and memory documents.

## 📄 License

This project is designed for educational use. Feel free to use it in academic settings, training programs, or as a reference for your own projects.

## 🛠️ Development Tools

This project's initial specification and memory document templates were generated using **[Arcana](https://impressto.ca/arcana.php#/)** - an AI-powered tool for creating structured technical documentation. The templates were then refined and populated through the actual development process to demonstrate real-world spec-driven development.

---

**Built with ❤️ for education and real-world application**

*This project demonstrates that educational examples don't have to be toy applications - they can be fully functional software that provides genuine value while teaching important development practices.*
