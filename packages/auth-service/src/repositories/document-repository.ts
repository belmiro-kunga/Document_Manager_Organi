// Document repository for Authentication Service
// Repositório de documento para o Serviço de Autenticação
import { PoolClient } from 'pg';
import { DatabaseService } from '../services/database';
import { 
  Document, 
  DocumentRow, 
  CreateDocumentInput, 
  UpdateDocumentInput, 
  DocumentSearchFilters,
  DocumentSearchResult,
  DocumentType,
  DocumentStatus,
  DocumentAccessLevel,
  DocumentMetadata,
  DocumentStorage,
  DocumentVersion,
  DocumentPermission,
  DocumentTag,
  DocumentComment,
  DocumentActivity,
  DocumentActivityType,
  BulkDocumentOperation,
  DocumentStatistics,
  DocumentShareLink
} from '../models/document';

/**
 * Document repository class
 */
export class DocumentRepository {
  private db = DatabaseService;

  /**
   * Create a new document
   */
  async create(documentData: CreateDocumentInput, storage: DocumentStorage, metadata: DocumentMetadata, createdBy: string): Promise<Document> {
    const query = `
      INSERT INTO documents (
        name, description, type, status, access_level, folder_id, path,
        storage, metadata, searchable_text, last_modified_at, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11
      ) RETURNING *
    `;

    // Generate path based on folder hierarchy
    const path = await this.generateDocumentPath(documentData.folderId, documentData.name);

    // Extract searchable text from metadata
    const searchableText = this.extractSearchableText(documentData.name, documentData.description, metadata);

    const values = [
      documentData.name,
      documentData.description || null,
      documentData.type,
      DocumentStatus.ACTIVE,
      documentData.accessLevel || DocumentAccessLevel.INTERNAL,
      documentData.folderId || null,
      path,
      JSON.stringify(storage),
      JSON.stringify(metadata),
      searchableText,
      createdBy
    ];

    const result = await this.db.query<DocumentRow>(query, values);
    const document = this.mapRowToDocument(result.rows[0]);

    // Create initial version
    await this.createVersion(document.id, storage, metadata, createdBy, 'Initial version');

    // Add tags if provided
    if (documentData.tags && documentData.tags.length > 0) {
      await this.addTags(document.id, documentData.tags, createdBy);
    }

    // Log activity
    await this.logActivity(document.id, createdBy, DocumentActivityType.CREATED, 'Document created');

    return document;
  }

  /**
   * Find document by ID
   */
  async findById(id: string, includeDeleted = false): Promise<Document | null> {
    let query = `
      SELECT * FROM documents 
      WHERE id = $1
    `;

    if (!includeDeleted) {
      query += ` AND deleted_at IS NULL`;
    }

    const result = await this.db.query<DocumentRow>(query, [id]);
    return result.rows.length > 0 ? this.mapRowToDocument(result.rows[0]) : null;
  }

  /**
   * Find documents by folder ID
   */
  async findByFolderId(folderId: string | null, includeDeleted = false): Promise<Document[]> {
    let query = `
      SELECT * FROM documents 
      WHERE folder_id ${folderId ? '= $1' : 'IS NULL'}
    `;

    if (!includeDeleted) {
      query += ` AND deleted_at IS NULL`;
    }

    query += ` ORDER BY name ASC`;

    const values = folderId ? [folderId] : [];
    const result = await this.db.query<DocumentRow>(query, values);
    return result.rows.map(row => this.mapRowToDocument(row));
  }

  /**
   * Update document
   */
  async update(id: string, documentData: UpdateDocumentInput, updatedBy: string): Promise<Document | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (documentData.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(documentData.name);
    }
    if (documentData.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(documentData.description);
    }
    if (documentData.type !== undefined) {
      updateFields.push(`type = $${paramIndex++}`);
      values.push(documentData.type);
    }
    if (documentData.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(documentData.status);
    }
    if (documentData.accessLevel !== undefined) {
      updateFields.push(`access_level = $${paramIndex++}`);
      values.push(documentData.accessLevel);
    }
    if (documentData.folderId !== undefined) {
      updateFields.push(`folder_id = $${paramIndex++}`);
      values.push(documentData.folderId);
      
      // Update path if folder changed
      const newPath = await this.generateDocumentPath(documentData.folderId, documentData.name);
      updateFields.push(`path = $${paramIndex++}`);
      values.push(newPath);
    }
    if (documentData.metadata !== undefined) {
      updateFields.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(documentData.metadata));
    }
    if (documentData.isFavorite !== undefined) {
      updateFields.push(`is_favorite = $${paramIndex++}`);
      values.push(documentData.isFavorite);
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    // Always update last_modified_at and updated_by
    updateFields.push(`last_modified_at = NOW()`);
    updateFields.push(`updated_at = NOW()`);
    updateFields.push(`updated_by = $${paramIndex++}`);
    values.push(updatedBy);

    // Add ID parameter
    values.push(id);

    const query = `
      UPDATE documents 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.db.query<DocumentRow>(query, values);
    
    if (result.rows.length > 0) {
      // Update tags if provided
      if (documentData.tags !== undefined) {
        await this.updateTags(id, documentData.tags, updatedBy);
      }

      // Log activity
      await this.logActivity(id, updatedBy, DocumentActivityType.UPDATED, 'Document updated');

      return this.mapRowToDocument(result.rows[0]);
    }

    return null;
  }

  /**
   * Soft delete document
   */
  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const query = `
      UPDATE documents 
      SET deleted_at = NOW(), updated_at = NOW(), updated_by = $2, status = $3
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [id, deletedBy, DocumentStatus.DELETED]);
    
    if (result.rowCount > 0) {
      await this.logActivity(id, deletedBy, DocumentActivityType.DELETED, 'Document deleted');
      return true;
    }

    return false;
  }

  /**
   * Restore soft deleted document
   */
  async restore(id: string, restoredBy: string): Promise<boolean> {
    const query = `
      UPDATE documents 
      SET deleted_at = NULL, updated_at = NOW(), updated_by = $2, status = $3
      WHERE id = $1 AND deleted_at IS NOT NULL
    `;

    const result = await this.db.query(query, [id, restoredBy, DocumentStatus.ACTIVE]);
    
    if (result.rowCount > 0) {
      await this.logActivity(id, restoredBy, DocumentActivityType.RESTORED, 'Document restored');
      return true;
    }

    return false;
  }

  /**
   * Hard delete document (permanent)
   */
  async hardDelete(id: string): Promise<boolean> {
    // Delete in order due to foreign key constraints
    await this.db.query('DELETE FROM document_activities WHERE document_id = $1', [id]);
    await this.db.query('DELETE FROM document_comments WHERE document_id = $1', [id]);
    await this.db.query('DELETE FROM document_permissions WHERE document_id = $1', [id]);
    await this.db.query('DELETE FROM document_tags WHERE document_id = $1', [id]);
    await this.db.query('DELETE FROM document_versions WHERE document_id = $1', [id]);
    
    const result = await this.db.query('DELETE FROM documents WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Search documents with filters and pagination
   */
  async search(filters: DocumentSearchFilters & { page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<DocumentSearchResult> {
    let query = `
      SELECT d.* FROM documents d
      WHERE d.deleted_at IS NULL
    `;
    const values: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.query) {
      query += ` AND (
        d.name ILIKE $${paramIndex} OR 
        d.description ILIKE $${paramIndex} OR 
        d.searchable_text ILIKE $${paramIndex}
      )`;
      values.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND d.type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND d.status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.accessLevel) {
      query += ` AND d.access_level = $${paramIndex}`;
      values.push(filters.accessLevel);
      paramIndex++;
    }

    if (filters.folderId !== undefined) {
      if (filters.folderId === null) {
        query += ` AND d.folder_id IS NULL`;
      } else {
        query += ` AND d.folder_id = $${paramIndex}`;
        values.push(filters.folderId);
        paramIndex++;
      }
    }

    if (filters.createdBy) {
      query += ` AND d.created_by = $${paramIndex}`;
      values.push(filters.createdBy);
      paramIndex++;
    }

    if (filters.createdAfter) {
      query += ` AND d.created_at >= $${paramIndex}`;
      values.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      query += ` AND d.created_at <= $${paramIndex}`;
      values.push(filters.createdBefore);
      paramIndex++;
    }

    if (filters.modifiedAfter) {
      query += ` AND d.last_modified_at >= $${paramIndex}`;
      values.push(filters.modifiedAfter);
      paramIndex++;
    }

    if (filters.modifiedBefore) {
      query += ` AND d.last_modified_at <= $${paramIndex}`;
      values.push(filters.modifiedBefore);
      paramIndex++;
    }

    if (filters.minSize !== undefined) {
      query += ` AND (d.metadata->>'fileSize')::bigint >= $${paramIndex}`;
      values.push(filters.minSize);
      paramIndex++;
    }

    if (filters.maxSize !== undefined) {
      query += ` AND (d.metadata->>'fileSize')::bigint <= $${paramIndex}`;
      values.push(filters.maxSize);
      paramIndex++;
    }

    if (filters.hasOcr !== undefined) {
      query += ` AND (d.metadata->>'ocrProcessed')::boolean = $${paramIndex}`;
      values.push(filters.hasOcr);
      paramIndex++;
    }

    if (filters.hasAi !== undefined) {
      query += ` AND (d.metadata->>'aiProcessed')::boolean = $${paramIndex}`;
      values.push(filters.hasAi);
      paramIndex++;
    }

    if (filters.isFavorite !== undefined) {
      query += ` AND d.is_favorite = $${paramIndex}`;
      values.push(filters.isFavorite);
      paramIndex++;
    }

    if (filters.isLocked !== undefined) {
      query += ` AND d.is_locked = $${paramIndex}`;
      values.push(filters.isLocked);
      paramIndex++;
    }

    // Handle tags filter
    if (filters.tags && filters.tags.length > 0) {
      query += ` AND EXISTS (
        SELECT 1 FROM document_tags dt 
        JOIN tags t ON dt.tag_id = t.id 
        WHERE dt.document_id = d.id AND t.name = ANY($${paramIndex})
      )`;
      values.push(filters.tags);
      paramIndex++;
    }

    // Count total records
    const countQuery = query.replace('SELECT d.*', 'SELECT COUNT(*)');
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query += ` ORDER BY d.${sortBy} ${sortOrder.toUpperCase()}`;

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await this.db.query<DocumentRow>(query, values);
    const documents = result.rows.map(row => this.mapRowToDocument(row));

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update view count
   */
  async updateViewCount(id: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE documents 
      SET view_count = view_count + 1, last_viewed_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [id]);
    
    if (result.rowCount > 0) {
      await this.logActivity(id, userId, DocumentActivityType.VIEWED, 'Document viewed');
      return true;
    }

    return false;
  }

  /**
   * Update download count
   */
  async updateDownloadCount(id: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE documents 
      SET download_count = download_count + 1, last_downloaded_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [id]);
    
    if (result.rowCount > 0) {
      await this.logActivity(id, userId, DocumentActivityType.DOWNLOADED, 'Document downloaded');
      return true;
    }

    return false;
  }

  /**
   * Lock document
   */
  async lock(id: string, lockedBy: string, reason?: string): Promise<boolean> {
    const query = `
      UPDATE documents 
      SET is_locked = true, locked_by = $2, locked_at = NOW(), lock_reason = $3, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL AND is_locked = false
    `;

    const result = await this.db.query(query, [id, lockedBy, reason]);
    return result.rowCount > 0;
  }

  /**
   * Unlock document
   */
  async unlock(id: string, unlockedBy: string): Promise<boolean> {
    const query = `
      UPDATE documents 
      SET is_locked = false, locked_by = NULL, locked_at = NULL, lock_reason = NULL, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL AND is_locked = true
    `;

    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get document count
   */
  async count(filters?: Partial<DocumentSearchFilters>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM documents WHERE deleted_at IS NULL`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.type) {
      query += ` AND type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters?.createdBy) {
      query += ` AND created_by = $${paramIndex}`;
      values.push(filters.createdBy);
      paramIndex++;
    }

    const result = await this.db.query(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get document statistics
   */
  async getStatistics(): Promise<DocumentStatistics> {
    const queries = [
      // Total documents and size
      `SELECT COUNT(*) as total, COALESCE(SUM((metadata->>'fileSize')::bigint), 0) as total_size 
       FROM documents WHERE deleted_at IS NULL`,
      
      // Documents by type
      `SELECT type, COUNT(*) as count FROM documents 
       WHERE deleted_at IS NULL GROUP BY type`,
      
      // Documents by status
      `SELECT status, COUNT(*) as count FROM documents 
       WHERE deleted_at IS NULL GROUP BY status`,
      
      // Documents by access level
      `SELECT access_level, COUNT(*) as count FROM documents 
       WHERE deleted_at IS NULL GROUP BY access_level`,
      
      // Most viewed documents
      `SELECT id, name, view_count FROM documents 
       WHERE deleted_at IS NULL ORDER BY view_count DESC LIMIT 10`,
      
      // Most downloaded documents
      `SELECT id, name, download_count FROM documents 
       WHERE deleted_at IS NULL ORDER BY download_count DESC LIMIT 10`,
      
      // Recent activity
      `SELECT * FROM document_activities 
       ORDER BY timestamp DESC LIMIT 20`
    ];

    const results = await Promise.all(
      queries.map(query => this.db.query(query))
    );

    const documentsByType: Record<DocumentType, number> = {} as any;
    results[1].rows.forEach(row => {
      documentsByType[row.type as DocumentType] = parseInt(row.count);
    });

    const documentsByStatus: Record<DocumentStatus, number> = {} as any;
    results[2].rows.forEach(row => {
      documentsByStatus[row.status as DocumentStatus] = parseInt(row.count);
    });

    const documentsByAccessLevel: Record<DocumentAccessLevel, number> = {} as any;
    results[3].rows.forEach(row => {
      documentsByAccessLevel[row.access_level as DocumentAccessLevel] = parseInt(row.count);
    });

    const totalSize = parseInt(results[0].rows[0].total_size);
    const totalDocuments = parseInt(results[0].rows[0].total);

    return {
      totalDocuments,
      totalSize,
      documentsByType,
      documentsByStatus,
      documentsByAccessLevel,
      averageFileSize: totalDocuments > 0 ? Math.round(totalSize / totalDocuments) : 0,
      mostViewedDocuments: results[4].rows.map(row => ({
        id: row.id,
        name: row.name,
        viewCount: row.view_count
      })),
      mostDownloadedDocuments: results[5].rows.map(row => ({
        id: row.id,
        name: row.name,
        downloadCount: row.download_count
      })),
      recentActivity: results[6].rows,
      storageUsage: [] // TODO: Implement storage usage calculation
    };
  }

  /**
   * Create document version
   */
  private async createVersion(documentId: string, storage: DocumentStorage, metadata: DocumentMetadata, createdBy: string, comment?: string): Promise<void> {
    // Get current version count
    const countResult = await this.db.query(
      'SELECT COALESCE(MAX(version_number), 0) as max_version FROM document_versions WHERE document_id = $1',
      [documentId]
    );
    const nextVersion = parseInt(countResult.rows[0].max_version) + 1;

    const query = `
      INSERT INTO document_versions (
        document_id, version_number, comment, storage, metadata, created_by, size, checksum
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const values = [
      documentId,
      nextVersion,
      comment || null,
      JSON.stringify(storage),
      JSON.stringify(metadata),
      createdBy,
      metadata.fileSize,
      metadata.checksum
    ];

    const result = await this.db.query(query, values);
    const versionId = result.rows[0].id;

    // Update document's current version
    await this.db.query(
      'UPDATE documents SET current_version_id = $1, version_count = $2 WHERE id = $3',
      [versionId, nextVersion, documentId]
    );
  }

  /**
   * Add tags to document
   */
  private async addTags(documentId: string, tagNames: string[], createdBy: string): Promise<void> {
    for (const tagName of tagNames) {
      // Create tag if it doesn't exist
      const tagResult = await this.db.query(
        'INSERT INTO tags (name, created_by) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
        [tagName, createdBy]
      );
      const tagId = tagResult.rows[0].id;

      // Link tag to document
      await this.db.query(
        'INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [documentId, tagId]
      );
    }
  }

  /**
   * Update document tags
   */
  private async updateTags(documentId: string, tagNames: string[], updatedBy: string): Promise<void> {
    // Remove existing tags
    await this.db.query('DELETE FROM document_tags WHERE document_id = $1', [documentId]);
    
    // Add new tags
    if (tagNames.length > 0) {
      await this.addTags(documentId, tagNames, updatedBy);
    }
  }

  /**
   * Log document activity
   */
  private async logActivity(documentId: string, userId: string, action: DocumentActivityType, description: string, metadata?: any): Promise<void> {
    const query = `
      INSERT INTO document_activities (document_id, user_id, action, description, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await this.db.query(query, [documentId, userId, action, description, JSON.stringify(metadata || {})]);
  }

  /**
   * Generate document path based on folder hierarchy
   */
  private async generateDocumentPath(folderId: string | null, documentName: string): Promise<string> {
    if (!folderId) {
      return `/${documentName}`;
    }

    // TODO: Implement folder hierarchy path generation
    // For now, return simple path
    return `/${folderId}/${documentName}`;
  }

  /**
   * Extract searchable text from document metadata
   */
  private extractSearchableText(name: string, description?: string, metadata?: DocumentMetadata): string {
    const parts = [name];
    
    if (description) parts.push(description);
    if (metadata?.title) parts.push(metadata.title);
    if (metadata?.subject) parts.push(metadata.subject);
    if (metadata?.author) parts.push(metadata.author);
    if (metadata?.keywords) parts.push(...metadata.keywords);
    if (metadata?.ocrText) parts.push(metadata.ocrText);
    if (metadata?.aiSummary) parts.push(metadata.aiSummary);
    if (metadata?.aiKeywords) parts.push(...metadata.aiKeywords);

    return parts.join(' ').toLowerCase();
  }

  /**
   * Map database row to document object
   */
  private mapRowToDocument(row: DocumentRow): Document {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type as DocumentType,
      status: row.status as DocumentStatus,
      accessLevel: row.access_level as DocumentAccessLevel,
      folderId: row.folder_id,
      path: row.path,
      currentVersionId: row.current_version_id,
      versionCount: row.version_count,
      storage: row.storage || {},
      metadata: row.metadata || {},
      versions: [], // TODO: Load versions if needed
      permissions: [], // TODO: Load permissions if needed
      tags: [], // TODO: Load tags if needed
      comments: [], // TODO: Load comments if needed
      activities: [], // TODO: Load activities if needed
      viewCount: row.view_count,
      downloadCount: row.download_count,
      shareCount: row.share_count,
      commentCount: row.comment_count,
      lastViewedAt: row.last_viewed_at,
      lastDownloadedAt: row.last_downloaded_at,
      lastModifiedAt: row.last_modified_at,
      isFavorite: row.is_favorite,
      isLocked: row.is_locked,
      lockedBy: row.locked_by,
      lockedAt: row.locked_at,
      lockReason: row.lock_reason,
      searchableText: row.searchable_text,
      indexedAt: row.indexed_at,
      searchVector: row.search_vector,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

// Export singleton instance
export const documentRepository = new DocumentRepository();