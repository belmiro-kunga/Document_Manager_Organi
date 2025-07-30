// Folder repository tests for Authentication Service
// Testes do repositório de pasta para o Serviço de Autenticação
import { FolderRepository } from '../../src/repositories/folder-repository';
import { DatabaseService } from '../../src/services/database';
import { 
  FolderType, 
  FolderStatus, 
  FolderAccessLevel, 
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
  CopyFolderInput,
  FolderSearchFilters
} from '../../src/models/folder';

// Mock the database service
jest.mock('../../src/services/database');

describe('FolderRepository', () => {
  let folderRepository: FolderRepository;
  let mockDb: jest.Mocked<typeof DatabaseService>;

  beforeEach(() => {
    folderRepository = new FolderRepository();
    mockDb = DatabaseService as jest.Mocked<typeof DatabaseService>;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new root folder successfully', async () => {
      const folderData: CreateFolderInput = {
        name: 'Test Folder',
        description: 'Test folder description',
        type: FolderType.REGULAR,
        accessLevel: FolderAccessLevel.INTERNAL
      };

      const mockFolderRow = {
        id: 'folder-123',
        name: folderData.name,
        description: folderData.description,
        type: folderData.type,
        status: FolderStatus.ACTIVE,
        access_level: folderData.accessLevel,
        parent_id: null,
        path: '/Test Folder',
        level: 0,
        position: 1,
        left_bound: 1,
        right_bound: 2,
        has_children: false,
        metadata: {},
        document_count: 0,
        subfolder_count: 0,
        total_size: 0,
        last_activity_at: null,
        is_shared: false,
        is_locked: false,
        locked_by: null,
        locked_at: null,
        lock_reason: null,
        template_id: null,
        is_template: false,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: 'user-123',
        updated_by: null
      };

      // Mock transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [mockFolderRow],
            rowCount: 1,
            command: 'INSERT',
            oid: 0,
            fields: []
          })
        };
        return await callback(mockClient as any);
      });

      const result = await folderRepository.create(folderData, 'user-123');

      expect(result).toBeDefined();
      expect(result.name).toBe(folderData.name);
      expect(result.description).toBe(folderData.description);
      expect(result.type).toBe(folderData.type);
      expect(result.accessLevel).toBe(folderData.accessLevel);
      expect(result.level).toBe(0);
      expect(result.path).toBe('/Test Folder');
      expect(result.hasChildren).toBe(false);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('should create a subfolder successfully', async () => {
      const parentFolder = {
        id: 'parent-123',
        name: 'Parent Folder',
        path: '/Parent Folder',
        level: 0,
        rightBound: 10
      };

      const folderData: CreateFolderInput = {
        name: 'Sub Folder',
        parentId: 'parent-123'
      };

      const mockFolderRow = {
        id: 'folder-123',
        name: folderData.name,
        description: null,
        type: FolderType.REGULAR,
        status: FolderStatus.ACTIVE,
        access_level: FolderAccessLevel.INTERNAL,
        parent_id: 'parent-123',
        path: '/Parent Folder/Sub Folder',
        level: 1,
        position: 1,
        left_bound: 10,
        right_bound: 11,
        has_children: false,
        metadata: {},
        document_count: 0,
        subfolder_count: 0,
        total_size: 0,
        last_activity_at: null,
        is_shared: false,
        is_locked: false,
        locked_by: null,
        locked_at: null,
        lock_reason: null,
        template_id: null,
        is_template: false,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: 'user-123',
        updated_by: null
      };

      // Mock findById to return parent folder
      jest.spyOn(folderRepository, 'findById').mockResolvedValue(parentFolder as any);

      // Mock transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [mockFolderRow],
            rowCount: 1,
            command: 'INSERT',
            oid: 0,
            fields: []
          })
        };
        return await callback(mockClient as any);
      });

      const result = await folderRepository.create(folderData, 'user-123');

      expect(result).toBeDefined();
      expect(result.name).toBe(folderData.name);
      expect(result.parentId).toBe('parent-123');
      expect(result.level).toBe(1);
      expect(result.path).toBe('/Parent Folder/Sub Folder');

      expect(folderRepository.findById).toHaveBeenCalledWith('parent-123');
    });

    it('should throw error if parent folder not found', async () => {
      const folderData: CreateFolderInput = {
        name: 'Sub Folder',
        parentId: 'non-existent-parent'
      };

      // Mock findById to return null
      jest.spyOn(folderRepository, 'findById').mockResolvedValue(null);

      // Mock transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {} as any;
        return await callback(mockClient);
      });

      await expect(folderRepository.create(folderData, 'user-123')).rejects.toThrow('Pasta pai não encontrada');
    });
  });

  describe('findById', () => {
    it('should find folder by ID', async () => {
      const folderId = 'folder-123';
      const mockFolderRow = {
        id: folderId,
        name: 'Test Folder',
        description: 'Test description',
        type: FolderType.REGULAR,
        status: FolderStatus.ACTIVE,
        access_level: FolderAccessLevel.INTERNAL,
        parent_id: null,
        path: '/Test Folder',
        level: 0,
        position: 1,
        left_bound: 1,
        right_bound: 2,
        has_children: false,
        metadata: {},
        document_count: 0,
        subfolder_count: 0,
        total_size: 0,
        last_activity_at: null,
        is_shared: false,
        is_locked: false,
        locked_by: null,
        locked_at: null,
        lock_reason: null,
        template_id: null,
        is_template: false,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: 'user-123',
        updated_by: null
      };

      mockDb.query.mockResolvedValue({
        rows: [mockFolderRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await folderRepository.findById(folderId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(folderId);
      expect(result?.name).toBe('Test Folder');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM folders WHERE id = $1 AND deleted_at IS NULL'),
        [folderId]
      );
    });

    it('should return null if folder not found', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await folderRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should include deleted folders when includeDeleted is true', async () => {
      const folderId = 'folder-123';

      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await folderRepository.findById(folderId, true);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM folders WHERE id = $1'),
        [folderId]
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.not.stringContaining('AND deleted_at IS NULL'),
        [folderId]
      );
    });
  });

  describe('findByParentId', () => {
    it('should find folders by parent ID', async () => {
      const parentId = 'parent-123';
      const mockFolderRows = [
        {
          id: 'folder-1',
          name: 'Folder 1',
          parent_id: parentId,
          position: 1,
          // ... other fields
        },
        {
          id: 'folder-2',
          name: 'Folder 2',
          parent_id: parentId,
          position: 2,
          // ... other fields
        }
      ];

      mockDb.query.mockResolvedValue({
        rows: mockFolderRows,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await folderRepository.findByParentId(parentId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('folder-1');
      expect(result[1].id).toBe('folder-2');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE parent_id = $1'),
        [parentId]
      );
    });

    it('should find root folders when parentId is null', async () => {
      mockDb.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await folderRepository.findByParentId(null);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE parent_id IS NULL'),
        []
      );
    });
  });

  describe('update', () => {
    it('should update folder successfully', async () => {
      const folderId = 'folder-123';
      const updateData: UpdateFolderInput = {
        name: 'Updated Folder',
        description: 'Updated description'
      };

      const mockUpdatedRow = {
        id: folderId,
        name: updateData.name,
        description: updateData.description,
        type: FolderType.REGULAR,
        status: FolderStatus.ACTIVE,
        access_level: FolderAccessLevel.INTERNAL,
        parent_id: null,
        path: '/Updated Folder',
        level: 0,
        position: 1,
        left_bound: 1,
        right_bound: 2,
        has_children: false,
        metadata: {},
        document_count: 0,
        subfolder_count: 0,
        total_size: 0,
        last_activity_at: null,
        is_shared: false,
        is_locked: false,
        locked_by: null,
        locked_at: null,
        lock_reason: null,
        template_id: null,
        is_template: false,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        created_by: 'user-123',
        updated_by: 'user-456'
      };

      // Mock findById for path update
      jest.spyOn(folderRepository, 'findById').mockResolvedValue({
        id: folderId,
        path: '/Old Folder',
        // ... other fields
      } as any);

      // Mock transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [mockUpdatedRow],
            rowCount: 1,
            command: 'UPDATE',
            oid: 0,
            fields: []
          })
        };
        return await callback(mockClient as any);
      });

      const result = await folderRepository.update(folderId, updateData, 'user-456');

      expect(result).toBeDefined();
      expect(result?.name).toBe(updateData.name);
      expect(result?.description).toBe(updateData.description);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('should return existing folder if no updates provided', async () => {
      const folderId = 'folder-123';
      const existingFolder = {
        id: folderId,
        name: 'Existing Folder',
        // ... other fields
      };

      jest.spyOn(folderRepository, 'findById').mockResolvedValue(existingFolder as any);

      // Mock transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {} as any;
        return await callback(mockClient);
      });

      const result = await folderRepository.update(folderId, {}, 'user-456');

      expect(result).toBe(existingFolder);
      expect(folderRepository.findById).toHaveBeenCalledWith(folderId);
    });
  });

  describe('move', () => {
    it('should move folder to new parent successfully', async () => {
      const folderId = 'folder-123';
      const sourceFolder = {
        id: folderId,
        name: 'Source Folder',
        parentId: 'old-parent',
        level: 1,
        path: '/Old Parent/Source Folder',
        leftBound: 5,
        rightBound: 6
      };

      const targetParent = {
        id: 'new-parent',
        name: 'New Parent',
        level: 0,
        path: '/New Parent',
        rightBound: 10
      };

      const moveData: MoveFolderInput = {
        targetParentId: 'new-parent',
        position: 1
      };

      const mockUpdatedRow = {
        id: folderId,
        name: sourceFolder.name,
        parent_id: 'new-parent',
        path: '/New Parent/Source Folder',
        level: 1,
        position: 1,
        // ... other fields
      };

      // Mock findById calls
      jest.spyOn(folderRepository, 'findById')
        .mockResolvedValueOnce(sourceFolder as any) // source folder
        .mockResolvedValueOnce(targetParent as any); // target parent

      // Mock isDescendant
      jest.spyOn(folderRepository as any, 'isDescendant').mockResolvedValue(false);

      // Mock transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [mockUpdatedRow],
            rowCount: 1,
            command: 'UPDATE',
            oid: 0,
            fields: []
          })
        };
        return await callback(mockClient as any);
      });

      const result = await folderRepository.move(folderId, moveData, 'user-123');

      expect(result).toBeDefined();
      expect(result?.parentId).toBe('new-parent');
      expect(result?.path).toBe('/New Parent/Source Folder');

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw error when trying to move folder to itself', async () => {
      const folderId = 'folder-123';
      const sourceFolder = {
        id: folderId,
        name: 'Source Folder'
      };

      const moveData: MoveFolderInput = {
        targetParentId: folderId
      };

      jest.spyOn(folderRepository, 'findById').mockResolvedValue(sourceFolder as any);
      jest.spyOn(folderRepository as any, 'isDescendant').mockResolvedValue(false);

      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {} as any;
        return await callback(mockClient);
      });

      await expect(folderRepository.move(folderId, moveData, 'user-123'))
        .rejects.toThrow('Não é possível mover pasta para si mesma ou seus descendentes');
    });

    it('should throw error when trying to move folder to its descendant', async () => {
      const folderId = 'folder-123';
      const sourceFolder = {
        id: folderId,
        name: 'Source Folder'
      };

      const moveData: MoveFolderInput = {
        targetParentId: 'descendant-folder'
      };

      jest.spyOn(folderRepository, 'findById').mockResolvedValue(sourceFolder as any);
      jest.spyOn(folderRepository as any, 'isDescendant').mockResolvedValue(true);

      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {} as any;
        return await callback(mockClient);
      });

      await expect(folderRepository.move(folderId, moveData, 'user-123'))
        .rejects.toThrow('Não é possível mover pasta para si mesma ou seus descendentes');
    });
  });

  describe('softDelete', () => {
    it('should soft delete folder successfully', async () => {
      const folderId = 'folder-123';
      const folder = {
        id: folderId,
        name: 'Test Folder',
        parentId: 'parent-123',
        leftBound: 5,
        rightBound: 10
      };

      jest.spyOn(folderRepository, 'findById').mockResolvedValue(folder as any);

      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {
          query: jest.fn().mockResolvedValue({
            rows: [],
            rowCount: 1,
            command: 'UPDATE',
            oid: 0,
            fields: []
          })
        };
        return await callback(mockClient as any);
      });

      const result = await folderRepository.softDelete(folderId, 'user-123');

      expect(result).toBe(true);
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('should return false if folder not found', async () => {
      jest.spyOn(folderRepository, 'findById').mockResolvedValue(null);

      mockDb.transaction.mockImplementation(async (callback) => {
        const mockClient = {} as any;
        return await callback(mockClient);
      });

      const result = await folderRepository.softDelete('non-existent-id', 'user-123');

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should search folders with filters and pagination', async () => {
      const filters: FolderSearchFilters = {
        query: 'test',
        type: FolderType.REGULAR,
        page: 1,
        limit: 10
      };

      const mockFolderRow = {
        id: 'folder-123',
        name: 'Test Folder',
        type: FolderType.REGULAR,
        // ... other fields
      };

      // Mock count query
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ count: '1' }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        })
        // Mock search query
        .mockResolvedValueOnce({
          rows: [mockFolderRow],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

      const result = await folderRepository.search(filters);

      expect(result).toBeDefined();
      expect(result.folders).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.pages).toBe(1);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStatistics', () => {
    it('should return folder statistics', async () => {
      const mockResults = [
        { rows: [{ total: '10' }] }, // total folders
        { rows: [{ total_size: '1000000' }] }, // total size
        { rows: [{ type: 'regular', count: '8' }, { type: 'shared', count: '2' }] }, // by type
        { rows: [{ status: 'active', count: '9' }, { status: 'archived', count: '1' }] }, // by status
        { rows: [{ access_level: 'internal', count: '7' }, { access_level: 'public', count: '3' }] }, // by access level
        { rows: [{ level: '0', count: '3' }, { level: '1', count: '7' }] }, // by level
        { rows: [{ id: 'folder-1', name: 'Large Folder', total_size: '500000' }] }, // largest folders
        { rows: [{ orphaned: '0' }] } // orphaned folders
      ];

      // Mock all queries
      mockResults.forEach((result, index) => {
        mockDb.query.mockResolvedValueOnce(result as any);
      });

      const result = await folderRepository.getStatistics();

      expect(result).toBeDefined();
      expect(result.totalFolders).toBe(10);
      expect(result.totalSize).toBe(1000000);
      expect(result.foldersByType).toBeDefined();
      expect(result.foldersByStatus).toBeDefined();
      expect(result.foldersByAccessLevel).toBeDefined();
      expect(result.foldersByLevel).toHaveLength(2);
      expect(result.largestFolders).toHaveLength(1);
      expect(result.orphanedFolders).toBe(0);

      expect(mockDb.query).toHaveBeenCalledTimes(8);
    });
  });
});