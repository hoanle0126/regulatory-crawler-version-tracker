export enum DocumentStatus {
  DRAFT_UNKNOWN = 'DRAFT_UNKNOWN',
  PUBLISHED = 'PUBLISHED',
  NOT_YET_EFFECTIVE = 'NOT_YET_EFFECTIVE',
  EFFECTIVE = 'EFFECTIVE',
  PARTIALLY_EFFECTIVE = 'PARTIALLY_EFFECTIVE',
  AMENDED = 'AMENDED',
  REPLACED = 'REPLACED',
  EXPIRED = 'EXPIRED',
  REPEALED = 'REPEALED',
  UNKNOWN = 'UNKNOWN',
}

export enum LegalNodeType {
  DOCUMENT = 'DOCUMENT',
  PART = 'PART',             // Phần
  CHAPTER = 'CHAPTER',       // Chương
  SECTION = 'SECTION',       // Mục
  ARTICLE = 'ARTICLE',       // Điều
  CLAUSE = 'CLAUSE',         // Khoản
  POINT = 'POINT',           // Điểm
  UNCLASSIFIED_BLOCK = 'UNCLASSIFIED_BLOCK',
}

export enum RelationshipType {
  AMENDS = 'AMENDS',
  AMENDED_BY = 'AMENDED_BY',
  REPLACES = 'REPLACES',
  REPLACED_BY = 'REPLACED_BY',
  REPEALS = 'REPEALS',
  REPEALED_BY = 'REPEALED_BY',
  REFERENCES = 'REFERENCES',
}

export enum ChangeType {
  ADDED = 'ADDED',
  MODIFIED = 'MODIFIED',
  REMOVED = 'REMOVED',
  MOVED = 'MOVED',
  RENAMED = 'RENAMED',
  UNCHANGED = 'UNCHANGED',
}

export enum ChangeSetStatus {
  DETECTED = 'DETECTED',
  REVIEWED = 'REVIEWED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IGNORED = 'IGNORED',
}

export enum CrawlRunStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum CrawlJobType {
  DISCOVER_DOCUMENTS = 'DISCOVER_DOCUMENTS',
  FETCH_DOCUMENT = 'FETCH_DOCUMENT',
  PARSE_DOCUMENT = 'PARSE_DOCUMENT',
  COMPARE_VERSION = 'COMPARE_VERSION',
  SEND_WEBHOOK = 'SEND_WEBHOOK',
}

export enum WebhookEvent {
  DOCUMENT_CREATED = 'document.created',
  DOCUMENT_VERSION_CREATED = 'document.version.created',
  DOCUMENT_CHANGED = 'document.changed',
  DOCUMENT_EXPIRED = 'document.expired',
  DOCUMENT_REPLACED = 'document.replaced',
  DOCUMENT_REINDEX_REQUIRED = 'document.reindex_required',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export enum CrawlErrorCode {
  SOURCE_TIMEOUT = 'SOURCE_TIMEOUT',
  SOURCE_RATE_LIMITED = 'SOURCE_RATE_LIMITED',
  SOURCE_BLOCKED = 'SOURCE_BLOCKED',
  UNSUPPORTED_CONTENT = 'UNSUPPORTED_CONTENT',
  UNSAFE_URL = 'UNSAFE_URL',
  PARSE_FAILED = 'PARSE_FAILED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  RESPONSE_TOO_LARGE = 'RESPONSE_TOO_LARGE',
  REDIRECT_LOOP = 'REDIRECT_LOOP',
}

export enum SourceAdapterType {
  HTML_LISTING = 'HTML_LISTING',
  HTML_ARTICLE = 'HTML_ARTICLE',
  PDF_DOCUMENT = 'PDF_DOCUMENT',
  MOCK_DEMO = 'MOCK_DEMO',
}

export interface ILegalNode {
  id?: string;
  type: LegalNodeType;
  number?: string | null;
  title?: string | null;
  content: string;
  parentId?: string | null;
  orderIndex: number;
  hierarchyPath: string; // e.g. "Chương II > Điều 5 > 1 > a"
  children?: ILegalNode[];
  metadata?: Record<string, unknown>;
}

export interface IDiffFragment {
  type: 'added' | 'removed' | 'common';
  value: string;
}

export interface IChangeItem {
  id?: string;
  changeSetId?: string;
  nodeType: LegalNodeType;
  hierarchyPath: string;
  changeType: ChangeType;
  oldContent?: string | null;
  newContent?: string | null;
  oldNodeId?: string | null;
  newNodeId?: string | null;
  similarityScore?: number | null;
  diffFragments?: IDiffFragment[];
  metadata?: Record<string, unknown>;
}

export interface IChangeSummary {
  addedCount: number;
  modifiedCount: number;
  removedCount: number;
  totalChanges: number;
  affectedArticles: string[];
  textSummary: string;
}

export interface IRagExportNode {
  type: LegalNodeType;
  number?: string | null;
  title?: string | null;
  hierarchyPath: string;
  content: string;
}

export interface IRagExportDocument {
  document: {
    id: string;
    canonicalId: string;
    title: string;
    documentNumber?: string | null;
    documentType?: string | null;
    issuingAuthority?: string | null;
    issuingDate?: string | null;
    publishedAt?: string | null;
    effectiveAt?: string | null;
    expiredAt?: string | null;
    status: DocumentStatus;
    sourceUrl: string;
  };
  version: {
    id: string;
    versionNumber: number;
    detectedAt: string;
    rawChecksum: string;
    normalizedChecksum: string;
  };
  nodes: IRagExportNode[];
}

export interface IWebhookPayload {
  eventId: string;
  eventType: WebhookEvent;
  timestamp: string;
  documentId: string;
  versionId?: string | null;
  changeSetId?: string | null;
  summary?: string | null;
  data: Record<string, unknown>;
}

export interface IPaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
