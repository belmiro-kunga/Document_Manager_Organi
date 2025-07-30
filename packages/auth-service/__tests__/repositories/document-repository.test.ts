// Document repository tests for Authentication Service
// Testes do repositório de documento para o Serviço de Autenticação
import { DocumentRepository } from '../../src/repositories/document-repository';
import { DatabaseService } from '../../src/services/database';
import { 
  DocumentType, 
  DocumentStatus, 
  DocumentAccessLevel, 
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentSearchFilters
} from '../../src/models/document';

// Mock the database service
jest.mock('../../src/services/database');

describe('DocumentRepository', () => {
  let documentRepository: DocumentRepository;
  let mockDb: jest.Mocked<typeof DatabaseService>;

  beforeEach(() => {
    documentRepository = new DocumentRepository();
    mockDb = DatabaseService as jest.Mocked<typeof DatabaseService>;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new document successfully', async () => {
      const documentData: CreateDocumentInput = {
        name: 'Test Document.pdf',
        description: 'Test document description',
        type: DocumentType.PDF,
        accessLevel: DocumentAccessLevel.INTERNAL,
        tags: ['test', 'document'],
        file: {
          originalName: 'test.pdf',
          buffer: Buffer.from('test content'),
          mimeType: 'application/pdf',
          size: 1024
        }
      };

      const storage = {
        provider: 'local' as const,
        path: '/documents/test.pdf',
        isPublic: false
      };

      const metadata = {
        originalName: 'test.pdf',
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extension: 'pdf',
        checksum: 'abc123',
        isEncrypted: false,
        hasPassword: false,
        hasDigitalSignature: false,
        ocrProcessed: false,
        aiProcessed: false
      };

      const mockDocumentRow = {
        id: 'doc-123',
        name: documentData.name,
        description: documentData.description,
        type: documentData.type,
        status: DocumentStatus.ACTIVE,
        access_level: documentData.accessLevel,
        folder_id: null,
  