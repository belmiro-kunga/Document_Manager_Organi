// Folder repository for Authentication Service
// Repositório de pasta para o Serviço de Autenticação
import { PoolClient } from 'pg';
import { DatabaseService } from '../services/database';
import { 
  Folder, 
  FolderRow, 
  CreateFolderInput, 
  UpdateFolderInput, 
  MoveFolderInput,
  CopyFolderInput,
  FolderSearchFilters,
  FolderSearchResult,
  FolderType,
  FolderStatus,
  FolderAccessLevel,
  FolderMetadata,
  FolderPermission,
  FolderActivity,
  FolderActivityType,
  FolderTreeNode,
  FolderBreadcrumb,
  BulkFolderOperation,
  FolderStatistics,
  FolderQuota
} from '../models/folder';

/**
 * Folder repository class with tree operations
 */
export class FolderRepository {
  private db = DatabaseService;

  /**
   * Create a new folder
   */
  async create(folderData: CreateFolderInput, createdBy: string): Promise<Folder> {
    return await this.db.transaction(async (client) => {
      // Get parent folder information if parentId is provided
      let parentFolder: Folder | null = null;
      let level = 0;
      let path = '/';
      let leftBound = 1;
      let rightBound = 2;

      if (folderData.parentId) {
        parentFolder = await this.findById(folderData.parentId);
        if (!parentFolder) {
          throw new Error('Pasta pai não encontrada');
        }
        level = parentFolder.level + 1;
        path = `${parentFolder.path}${parentFolder.path.endsWith('/') ? '' : '/'}${folderData.name}`;

        // Update nested set bounds for parent and siblings
        await this.updateNestedSetForInsert(client, parentFolder.rightBound);
        leftBound = parentFolder.rightBound;
        rightBound = parentFolder.rightBound + 1;
      } else {
        // Root folder
        const maxRightBound = await this.getMaxRightBound(client);
        leftBound = maxRightBound + 1;
        rightBound = maxRightBound + 2;
        path = `/${folderData.name}`;
      }

      // Determine position
      const position = folderData.position ?? await this.getNextPosition(client, folderData.parentId);

      // Create default metadata
      const defaultMetadata: FolderMetadata = {
        totalSize: 0,
        documentCount: 0,
        subfolderCount: 0,
        totalDocuments: 0,
        totalSubfolders: 0,
        requireApproval: false,
        enableVersioning: true,
        enableComments: true,
        isTemplate: false,
        ...folderData.metadata
      };

      const query = `
        INSERT INTO folders (
          name, description, type, status, access_level, parent_id, path, level, position,
          left_bound, right_bound, has_children, metadata, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *
      `;

      const values = [
        folderData.name,
        folderData.description || null,
        folderData.type || FolderType.REGULAR,
        FolderStatus.ACTIVE,
        folderData.accessLevel || FolderAccessLevel.INTERNAL,
        folderData.parentId || null,
        path,
        level,
        position,
        leftBound,
        rightBound,
        false, // has_children
        JSON.stringify(defaultMetadata),
        createdBy
      ];

      const result = await client.query<FolderRow>(query, values);
      const folder = this.mapRowToFolder(result.rows[0]);

      // Update parent folder's has_children flag
      if (parentFolder) {
        await this.updateHasChildren(client, parentFolder.id);
        await this.updateFolderCounts(client, parentFolder.id);
      }

      // Create default permissions if provided
      if (folderData.permissions && folderData.permissions.length > 0) {
        await this.createPermissions(client, folder.id, folderData.permissions, createdBy);
      }

      // Log activity
      await this.logActivity(client, folder.id, createdBy, FolderActivityType.CREATED, 'Pasta criada');

      return folder;
    });
  }

  /**
   * Find folder by ID
   */
  async findById(id: string, includeDeleted = false): Promise<Folder | null> {
    let query = `
      SELECT * FROM folders 
      WHERE id = $1
    `;

    if (!includeDeleted) {
      query += ` AND deleted_at IS NULL`;
    }

    const result = await this.db.query<FolderRow>(query, [id]);
    return result.rows.length > 0 ? this.mapRowToFolder(result.rows[0]) : null;
  }

  /**
   * Find folders by parent ID
   */
  async findByParentId(parentId: string | null, includeDeleted = false): Promise<Folder[]> {
    let query = `
      SELECT * FROM folders 
      WHERE parent_id ${parentId ? '= $1' : 'IS NULL'}
    `;

    if (!includeDeleted) {
      query += ` AND deleted_at IS NULL`;
    }

    query += ` ORDER BY position ASC, name ASC`;

    const values = parentId ? [parentId] : [];
    const result = await this.db.query<FolderRow>(query, values);
    return result.rows.map(row => this.mapRowToFolder(row));
  }

  /**
   * Get folder tree starting from a specific folder
   */
  async getTree(rootId?: string, maxDepth?: number): Promise<FolderTreeNode[]> {
    let query = `
      WITH RECURSIVE folder_tree AS (
        -- Base case: root folders or specific folder
        SELECT 
          id, name, path, level, parent_id, has_children,
          document_count, total_size, 0 as tree_level
        FROM folders 
        WHERE ${rootId ? 'id = $1' : 'parent_id IS NULL'}
          AND deleted_at IS NULL
        
        UNION ALL
        
        -- Recursive case: children
        SELECT 
          f.id, f.name, f.path, f.level, f.parent_id, f.has_children,
          f.document_count, f.total_size, ft.tree_level + 1
        FROM folders f
        INNER JOIN folder_tree ft ON f.parent_id = ft.id
        WHERE f.deleted_at IS NULL
          ${maxDepth ? `AND ft.tree_level < ${maxDepth - 1}` : ''}
      )
      SELECT * FROM folder_tree
      ORDER BY level, name
    `;

    const values = rootId ? [rootId] : [];
    const result = await this.db.query(query, values);

    return this.buildTreeStructure(result.rows);
  }

  /**
   * Get folder breadcrumb path
   */
  async getBreadcrumb(folderId: string): Promise<FolderBreadcrumb[]> {
    const query = `
      WITH RECURSIVE folder_path AS (
        -- Start with the target folder
        SELECT id, name, path, level, parent_id
        FROM folders 
        WHERE id = $1 AND deleted_at IS NULL
        
        UNION ALL
        
        -- Recursively get parent folders
        SELECT f.id, f.name, f.path, f.level, f.parent_id
        FROM folders f
        INNER JOIN folder_path fp ON f.id = fp.parent_id
        WHERE f.deleted_at IS NULL
      )
      SELECT id, name, path, level
      FROM folder_path
      ORDER BY level ASC
    `;

    const result = await this.db.query(query, [folderId]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      path: row.path,
      level: row.level
    }));
  }

  /**
   * Update folder
   */
  async update(id: string, folderData: UpdateFolderInput, updatedBy: string): Promise<Folder | null> {
    return await this.db.transaction(async (client) => {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      if (folderData.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(folderData.name);
        
        // Update path if name changed
        const currentFolder = await this.findById(id);
        if (currentFolder) {
          const newPath = this.generateNewPath(currentFolder.path, folderData.name);
          updateFields.push(`path = $${paramIndex++}`);
          values.push(newPath);
          
          // Update paths of all descendants
          await this.updateDescendantPaths(client, currentFolder.path, newPath);
        }
      }

      if (folderData.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(folderData.description);
      }

      if (folderData.type !== undefined) {
        updateFields.push(`type = $${paramIndex++}`);
        values.push(folderData.type);
      }

      if (folderData.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(folderData.status);
      }

      if (folderData.accessLevel !== undefined) {
        updateFields.push(`access_level = $${paramIndex++}`);
        values.push(folderData.accessLevel);
      }

      if (folderData.position !== undefined) {
        updateFields.push(`position = $${paramIndex++}`);
        values.push(folderData.position);
      }

      if (folderData.metadata !== undefined) {
        // Merge with existing metadata
        const currentFolder = await this.findById(id);
        if (currentFolder) {
          const mergedMetadata = { ...currentFolder.metadata, ...folderData.metadata };
          updateFields.push(`metadata = $${paramIndex++}`);
          values.push(JSON.stringify(mergedMetadata));
        }
      }

      if (folderData.isShared !== undefined) {
        updateFields.push(`is_shared = $${paramIndex++}`);
        values.push(folderData.isShared);
      }

      if (updateFields.length === 0) {
        return this.findById(id);
      }

      // Always update updated_at and updated_by
      updateFields.push(`updated_at = NOW()`);
      updateFields.push(`updated_by = $${paramIndex++}`);
      values.push(updatedBy);

      // Add ID parameter
      values.push(id);

      const query = `
        UPDATE folders 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query<FolderRow>(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      const folder = this.mapRowToFolder(result.rows[0]);

      // Log activity
      await this.logActivity(client, folder.id, updatedBy, FolderActivityType.UPDATED, 'Pasta atualizada');

      return folder;
    });
  }

  /**
   * Move folder to a new parent
   */
  async move(id: string, moveData: MoveFolderInput, movedBy: string): Promise<Folder | null> {
    return await this.db.transaction(async (client) => {
      const folder = await this.findById(id);
      if (!folder) {
        throw new Error('Pasta não encontrada');
      }

      // Prevent moving to itself or its descendants
      if (moveData.targetParentId) {
        const isDescendant = await this.isDescendant(id, moveData.targetParentId);
        if (isDescendant || id === moveData.targetParentId) {
          throw new Error('Não é possível mover pasta para si mesma ou seus descendentes');
        }
      }

      // Get target parent information
      let targetParent: Folder | null = null;
      let newLevel = 0;
      let newPath = '/';

      if (moveData.targetParentId) {
        targetParent = await this.findById(moveData.targetParentId);
        if (!targetParent) {
          throw new Error('Pasta de destino não encontrada');
        }
        newLevel = targetParent.level + 1;
        newPath = `${targetParent.path}${targetParent.path.endsWith('/') ? '' : '/'}${folder.name}`;
      } else {
        newPath = `/${folder.name}`;
      }

      // Calculate level difference for updating descendants
      const levelDiff = newLevel - folder.level;

      // Update nested set model
      await this.updateNestedSetForMove(client, folder, targetParent);

      // Update folder and all descendants
      await this.updateFolderHierarchy(client, folder, newPath, levelDiff);

      // Update position
      const position = moveData.position ?? await this.getNextPosition(client, moveData.targetParentId);
      
      const query = `
        UPDATE folders 
        SET parent_id = $1, path = $2, level = $3, position = $4, updated_at = NOW(), updated_by = $5
        WHERE id = $6
        RETURNING *
      `;

      const result = await client.query<FolderRow>(query, [
        moveData.targetParentId || null,
        newPath,
        newLevel,
        position,
        movedBy,
        id
      ]);

      // Update has_children flags for old and new parents
      if (folder.parentId) {
        await this.updateHasChildren(client, folder.parentId);
        await this.updateFolderCounts(client, folder.parentId);
      }
      if (targetParent) {
        await this.updateHasChildren(client, targetParent.id);
        await this.updateFolderCounts(client, targetParent.id);
      }

      // Log activity
      await this.logActivity(client, id, movedBy, FolderActivityType.MOVED, 
        `Pasta movida para ${targetParent ? targetParent.name : 'raiz'}`);

      return this.mapRowToFolder(result.rows[0]);
    });
  }

  /**
   * Copy folder to a new location
   */
  async copy(id: string, copyData: CopyFolderInput, copiedBy: string): Promise<Folder> {
    return await this.db.transaction(async (client) => {
      const sourceFolder = await this.findById(id);
      if (!sourceFolder) {
        throw new Error('Pasta não encontrada');
      }

      // Create the copy
      const copyName = copyData.newName || `${sourceFolder.name} - Cópia`;
      const createData: CreateFolderInput = {
        name: copyName,
        description: sourceFolder.description,
        type: sourceFolder.type,
        accessLevel: sourceFolder.accessLevel,
        parentId: copyData.targetParentId || sourceFolder.parentId,
        metadata: sourceFolder.metadata
      };

      const copiedFolder = await this.create(createData, copiedBy);

      // Copy permissions if requested
      if (copyData.copyPermissions) {
        await this.copyPermissions(client, id, copiedFolder.id, copiedBy);
      }

      // Copy documents if requested
      if (copyData.copyDocuments) {
        await this.copyDocuments(client, id, copiedFolder.id, copiedBy);
      }

      // Copy subfolders recursively if requested
      if (copyData.copySubfolders && copyData.recursive) {
        await this.copySubfolders(client, id, copiedFolder.id, copiedBy, copyData);
      }

      // Log activity
      await this.logActivity(client, copiedFolder.id, copiedBy, FolderActivityType.COPIED, 
        `Pasta copiada de ${sourceFolder.name}`);

      return copiedFolder;
    });
  }

  /**
   * Soft delete folder
   */
  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    return await this.db.transaction(async (client) => {
      const folder = await this.findById(id);
      if (!folder) {
        return false;
      }

      // Soft delete the folder and all its descendants
      const query = `
        UPDATE folders 
        SET deleted_at = NOW(), updated_at = NOW(), updated_by = $2, status = $3
        WHERE left_bound >= $4 AND right_bound <= $5 AND deleted_at IS NULL
      `;

      const result = await client.query(query, [
        id, deletedBy, FolderStatus.DELETED, folder.leftBound, folder.rightBound
      ]);

      // Update parent folder's has_children flag and counts
      if (folder.parentId) {
        await this.updateHasChildren(client, folder.parentId);
        await this.updateFolderCounts(client, folder.parentId);
      }

      // Log activity
      await this.logActivity(client, id, deletedBy, FolderActivityType.DELETED, 'Pasta excluída');

      return result.rowCount > 0;
    });
  }

  /**
   * Restore soft deleted folder
   */
  async restore(id: string, restoredBy: string): Promise<boolean> {
    return await this.db.transaction(async (client) => {
      const folder = await this.findById(id, true);
      if (!folder || !folder.deletedAt) {
        return false;
      }

      // Check if parent exists and is not deleted
      if (folder.parentId) {
        const parent = await this.findById(folder.parentId);
        if (!parent) {
          throw new Error('Pasta pai não existe ou foi excluída');
        }
      }

      // Restore the folder and all its descendants
      const query = `
        UPDATE folders 
        SET deleted_at = NULL, updated_at = NOW(), updated_by = $2, status = $3
        WHERE left_bound >= $4 AND right_bound <= $5 AND deleted_at IS NOT NULL
      `;

      const result = await client.query(query, [
        id, restoredBy, FolderStatus.ACTIVE, folder.leftBound, folder.rightBound
      ]);

      // Update parent folder's has_children flag and counts
      if (folder.parentId) {
        await this.updateHasChildren(client, folder.parentId);
        await this.updateFolderCounts(client, folder.parentId);
      }

      // Log activity
      await this.logActivity(client, id, restoredBy, FolderActivityType.RESTORED, 'Pasta restaurada');

      return result.rowCount > 0;
    });
  }

  /**
   * Hard delete folder (permanent)
   */
  async hardDelete(id: string): Promise<boolean> {
    return await this.db.transaction(async (client) => {
      const folder = await this.findById(id, true);
      if (!folder) {
        return false;
      }

      // Delete all related data
      await client.query('DELETE FROM folder_activities WHERE folder_id = $1', [id]);
      await client.query('DELETE FROM folder_permissions WHERE folder_id = $1', [id]);
      
      // Delete all descendants first (to maintain referential integrity)
      await client.query(`
        DELETE FROM folders 
        WHERE left_bound > $1 AND right_bound < $2
      `, [folder.leftBound, folder.rightBound]);

      // Delete the folder itself
      const result = await client.query('DELETE FROM folders WHERE id = $1', [id]);

      // Update nested set bounds
      await this.updateNestedSetAfterDelete(client, folder.leftBound, folder.rightBound);

      return result.rowCount > 0;
    });
  }

  /**
   * Search folders with filters and pagination
   */
  async search(filters: FolderSearchFilters & { page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<FolderSearchResult> {
    let query = `
      SELECT * FROM folders 
      WHERE deleted_at IS NULL
    `;
    const values: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.query) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      values.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.accessLevel) {
      query += ` AND access_level = $${paramIndex}`;
      values.push(filters.accessLevel);
      paramIndex++;
    }

    if (filters.parentId !== undefined) {
      if (filters.parentId === null) {
        query += ` AND parent_id IS NULL`;
      } else {
        query += ` AND parent_id = $${paramIndex}`;
        values.push(filters.parentId);
        paramIndex++;
      }
    }

    if (filters.level !== undefined) {
      query += ` AND level = $${paramIndex}`;
      values.push(filters.level);
      paramIndex++;
    }

    if (filters.hasChildren !== undefined) {
      query += ` AND has_children = $${paramIndex}`;
      values.push(filters.hasChildren);
      paramIndex++;
    }

    if (filters.isShared !== undefined) {
      query += ` AND is_shared = $${paramIndex}`;
      values.push(filters.isShared);
      paramIndex++;
    }

    if (filters.isLocked !== undefined) {
      query += ` AND is_locked = $${paramIndex}`;
      values.push(filters.isLocked);
      paramIndex++;
    }

    if (filters.isTemplate !== undefined) {
      query += ` AND is_template = $${paramIndex}`;
      values.push(filters.isTemplate);
      paramIndex++;
    }

    // Add more filters as needed...

    // Count total records
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Apply sorting
    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await this.db.query<FolderRow>(query, values);
    const folders = result.rows.map(row => this.mapRowToFolder(row));

    return {
      folders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get folder statistics
   */
  async getStatistics(): Promise<FolderStatistics> {
    const queries = [
      // Total folders
      `SELECT COUNT(*) as total FROM folders WHERE deleted_at IS NULL`,
      
      // Total size
      `SELECT COALESCE(SUM(total_size), 0) as total_size FROM folders WHERE deleted_at IS NULL`,
      
      // Folders by type
      `SELECT type, COUNT(*) as count FROM folders 
       WHERE deleted_at IS NULL GROUP BY type`,
      
      // Folders by status
      `SELECT status, COUNT(*) as count FROM folders 
       WHERE deleted_at IS NULL GROUP BY status`,
      
      // Folders by access level
      `SELECT access_level, COUNT(*) as count FROM folders 
       WHERE deleted_at IS NULL GROUP BY access_level`,
      
      // Folders by level
      `SELECT level, COUNT(*) as count FROM folders 
       WHERE deleted_at IS NULL GROUP BY level ORDER BY level`,
      
      // Largest folders
      `SELECT id, name, total_size FROM folders 
       WHERE deleted_at IS NULL ORDER BY total_size DESC LIMIT 10`,
      
      // Orphaned folders
      `SELECT COUNT(*) as orphaned FROM folders f1
       WHERE f1.parent_id IS NOT NULL 
       AND f1.deleted_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM folders f2 
         WHERE f2.id = f1.parent_id AND f2.deleted_at IS NULL
       )`
    ];

    const results = await Promise.all(
      queries.map(query => this.db.query(query))
    );

    const foldersByType: Record<string, number> = {};
    results[2].rows.forEach(row => {
      foldersByType[row.type] = parseInt(row.count);
    });

    const foldersByStatus: Record<string, number> = {};
    results[3].rows.forEach(row => {
      foldersByStatus[row.status] = parseInt(row.count);
    });

    const foldersByAccessLevel: Record<string, number> = {};
    results[4].rows.forEach(row => {
      foldersByAccessLevel[row.access_level] = parseInt(row.count);
    });

    const foldersByLevel = results[5].rows.map(row => ({
      level: parseInt(row.level),
      count: parseInt(row.count)
    }));

    const largestFolders = results[6].rows.map(row => ({
      id: row.id,
      name: row.name,
      size: parseInt(row.total_size)
    }));

    return {
      totalFolders: parseInt(results[0].rows[0].total),
      totalSize: parseInt(results[1].rows[0].total_size),
      foldersByType: foldersByType as Record<FolderType, number>,
      foldersByStatus: foldersByStatus as Record<FolderStatus, number>,
      foldersByAccessLevel: foldersByAccessLevel as Record<FolderAccessLevel, number>,
      foldersByLevel,
      averageFolderSize: Math.round(parseInt(results[1].rows[0].total_size) / parseInt(results[0].rows[0].total) || 0),
      largestFolders,
      mostActiveFolders: [], // Would need activity data
      recentActivity: [], // Would need activity data
      orphanedFolders: parseInt(results[7].rows[0].orphaned)
    };
  }

  // Helper methods

  /**
   * Map database row to folder object
   */
  private mapRowToFolder(row: FolderRow): Folder {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type as FolderType,
      status: row.status as FolderStatus,
      accessLevel: row.access_level as FolderAccessLevel,
      parentId: row.parent_id,
      path: row.path,
      level: row.level,
      position: row.position,
      leftBound: row.left_bound,
      rightBound: row.right_bound,
      hasChildren: row.has_children,
      metadata: row.metadata || {},
      permissions: [], // Would be loaded separately
      activities: [], // Would be loaded separately
      documentCount: row.document_count,
      subfolderCount: row.subfolder_count,
      totalSize: row.total_size,
      lastActivityAt: row.last_activity_at,
      isShared: row.is_shared,
      isLocked: row.is_locked,
      lockedBy: row.locked_by,
      lockedAt: row.locked_at,
      lockReason: row.lock_reason,
      templateId: row.template_id,
      isTemplate: row.is_template,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  /**
   * Build tree structure from flat array
   */
  private buildTreeStructure(rows: any[]): FolderTreeNode[] {
    const nodeMap = new Map<string, FolderTreeNode>();
    const rootNodes: FolderTreeNode[] = [];

    // Create nodes
    rows.forEach(row => {
      const node: FolderTreeNode = {
        id: row.id,
        name: row.name,
        path: row.path,
        level: row.level,
        parentId: row.parent_id,
        hasChildren: row.has_children,
        children: [],
        documentCount: row.document_count,
        totalSize: row.total_size,
        permissions: [] // Would be loaded separately
      };
      nodeMap.set(row.id, node);
    });

    // Build tree structure
    nodeMap.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  // Additional helper methods would be implemented here...
  private async updateNestedSetForInsert(client: PoolClient, rightBound: number): Promise<void> {
    // Implementation for nested set model updates
  }

  private async getMaxRightBound(client: PoolClient): Promise<number> {
    const result = await client.query('SELECT COALESCE(MAX(right_bound), 0) as max_bound FROM folders');
    return parseInt(result.rows[0].max_bound);
  }

  private async getNextPosition(client: PoolClient, parentId: string | null): Promise<number> {
    const query = `
      SELECT COALESCE(MAX(position), 0) + 1 as next_position 
      FROM folders 
      WHERE parent_id ${parentId ? '= $1' : 'IS NULL'} AND deleted_at IS NULL
    `;
    const values = parentId ? [parentId] : [];
    const result = await client.query(query, values);
    return parseInt(result.rows[0].next_position);
  }

  private async updateHasChildren(client: PoolClient, folderId: string): Promise<void> {
    const query = `
      UPDATE folders 
      SET has_children = EXISTS(
        SELECT 1 FROM folders 
        WHERE parent_id = $1 AND deleted_at IS NULL
      )
      WHERE id = $1
    `;
    await client.query(query, [folderId]);
  }

  private async updateFolderCounts(client: PoolClient, folderId: string): Promise<void> {
    // Implementation for updating folder counts
  }

  private async createPermissions(client: PoolClient, folderId: string, permissions: any[], createdBy: string): Promise<void> {
    // Implementation for creating folder permissions
  }

  private async logActivity(client: PoolClient, folderId: string, userId: string, action: FolderActivityType, description: string): Promise<void> {
    const query = `
      INSERT INTO folder_activities (folder_id, user_id, action, description)
      VALUES ($1, $2, $3, $4)
    `;
    await client.query(query, [folderId, userId, action, description]);
  }

  private generateNewPath(currentPath: string, newName: string): string {
    const pathParts = currentPath.split('/');
    pathParts[pathParts.length - 1] = newName;
    return pathParts.join('/');
  }

  private async updateDescendantPaths(client: PoolClient, oldPath: string, newPath: string): Promise<void> {
    const query = `
      UPDATE folders 
      SET path = $2 || SUBSTRING(path FROM ${oldPath.length + 1})
      WHERE path LIKE $1 AND path != $3
    `;
    await client.query(query, [`${oldPath}%`, newPath, oldPath]);
  }

  private async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM folders ancestor, folders descendant
      WHERE ancestor.id = $1 
      AND descendant.id = $2
      AND descendant.left_bound > ancestor.left_bound 
      AND descendant.right_bound < ancestor.right_bound
    `;
    const result = await this.db.query(query, [ancestorId, descendantId]);
    return result.rows.length > 0;
  }

  private async updateNestedSetForMove(client: PoolClient, folder: Folder, targetParent: Folder | null): Promise<void> {
    // Implementation for nested set model updates during move
  }

  private async updateFolderHierarchy(client: PoolClient, folder: Folder, newPath: string, levelDiff: number): Promise<void> {
    // Implementation for updating folder hierarchy
  }

  private async updateNestedSetAfterDelete(client: PoolClient, leftBound: number, rightBound: number): Promise<void> {
    // Implementation for nested set model updates after delete
  }

  private async copyPermissions(client: PoolClient, sourceId: string, targetId: string, copiedBy: string): Promise<void> {
    // Implementation for copying permissions
  }

  private async copyDocuments(client: PoolClient, sourceId: string, targetId: string, copiedBy: string): Promise<void> {
    // Implementation for copying documents
  }

  private async copySubfolders(client: PoolClient, sourceId: string, targetId: string, copiedBy: string, copyData: CopyFolderInput): Promise<void> {
    // Implementation for copying subfolders recursively
  }
}

// Export singleton instance
export const folderRepository = new FolderRepository();