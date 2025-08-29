export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: UserRole;
    organization: string;
    permissions: UserPermissions;
    preferences: UserPreferences;
    lastActive: Date;
    isOnline: boolean;
    industryContext?: IndustryContext;
}
export declare enum UserRole {
    ADMIN = "admin",
    MODERATOR = "moderator",
    USER = "user",
    GUEST = "guest",
    ENTERPRISE_ADMIN = "enterprise_admin"
}
export interface UserPermissions {
    canCreateMeetings: boolean;
    canRecordMeetings: boolean;
    canAccessPrivateChannels: boolean;
    canManageDocuments: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
    crossCompanyAccess: boolean;
}
export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: NotificationSettings;
    uiAdaptation: UIAdaptationSettings;
}
export interface NotificationSettings {
    email: boolean;
    push: boolean;
    inApp: boolean;
    reminders: boolean;
    mentions: boolean;
}
export interface UIAdaptationSettings {
    adaptByRole: boolean;
    adaptByIndustry: boolean;
    adaptByBehavior: boolean;
    customizations: Record<string, any>;
}
export interface IndustryContext {
    type: IndustryType;
    specificFeatures: string[];
    complianceRequirements: ComplianceType[];
}
export declare enum IndustryType {
    DEVELOPMENT_AGENCY = "development_agency",
    RESEARCH_INSTITUTION = "research_institution",
    MEDIA_PRODUCTION = "media_production",
    ENTERPRISE = "enterprise"
}
export declare enum ComplianceType {
    SOC2 = "soc2",
    GDPR = "gdpr",
    HIPAA = "hipaa",
    ISO27001 = "iso27001"
}
export interface Meeting {
    id: string;
    title: string;
    description?: string;
    organizerId: string;
    participants: Participant[];
    scheduledStart: Date;
    scheduledEnd: Date;
    actualStart?: Date;
    actualEnd?: Date;
    status: MeetingStatus;
    type: MeetingType;
    securitySettings: SecuritySettings;
    transcription?: TranscriptionData;
    recordings: Recording[];
    privateChannels: PrivateChannel[];
    spaceId?: string;
    threadId?: string;
}
export declare enum MeetingStatus {
    SCHEDULED = "scheduled",
    IN_PROGRESS = "in_progress",
    ENDED = "ended",
    CANCELLED = "cancelled"
}
export declare enum MeetingType {
    STANDARD = "standard",
    HIGH_SECURITY = "high_security",
    CROSS_COMPANY = "cross_company",
    PRIVATE = "private"
}
export interface Participant {
    userId: string;
    joinedAt?: Date;
    leftAt?: Date;
    role: ParticipantRole;
    permissions: ParticipantPermissions;
    audioEnabled: boolean;
    videoEnabled: boolean;
    isPresenting: boolean;
}
export declare enum ParticipantRole {
    HOST = "host",
    CO_HOST = "co_host",
    PARTICIPANT = "participant",
    OBSERVER = "observer"
}
export interface ParticipantPermissions {
    canSpeak: boolean;
    canShare: boolean;
    canRecord: boolean;
    canManageParticipants: boolean;
    canAccessPrivateChannels: boolean;
}
export interface SecuritySettings {
    recordingPrevention: RecordingPreventionConfig;
    encryptionLevel: EncryptionLevel;
    accessControl: AccessControlConfig;
    watermarking: WatermarkConfig;
    threatDetection: ThreatDetectionConfig;
}
export interface RecordingPreventionConfig {
    enabled: boolean;
    blockMediaRecorder: boolean;
    detectScreenCapture: boolean;
    scanForSoftware: boolean;
    monitorNetwork: boolean;
    autoDisconnectOnThreat: boolean;
    alertLevel: AlertLevel;
}
export declare enum EncryptionLevel {
    STANDARD = "standard",
    HIGH = "high",
    MAXIMUM = "maximum"
}
export interface AccessControlConfig {
    requireAuthentication: boolean;
    allowGuests: boolean;
    requireApproval: boolean;
    sessionTimeout: number;
    ipWhitelist?: string[];
}
export interface WatermarkConfig {
    enabled: boolean;
    userId: string;
    meetingId: string;
    timestamp: boolean;
    dynamic: boolean;
    opacity: number;
    position: WatermarkPosition;
}
export declare enum WatermarkPosition {
    TOP_LEFT = "top-left",
    TOP_RIGHT = "top-right",
    BOTTOM_LEFT = "bottom-left",
    BOTTOM_RIGHT = "bottom-right",
    CENTER = "center"
}
export interface ThreatDetectionConfig {
    enabled: boolean;
    sensitivity: ThreatSensitivity;
    autoResponse: boolean;
    logToBlockchain: boolean;
}
export declare enum ThreatSensitivity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    MAXIMUM = "maximum"
}
export declare enum AlertLevel {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical"
}
export interface SecurityThreat {
    id: string;
    type: ThreatType;
    severity: ThreatSeverity;
    description: string;
    detectedAt: Date;
    userId: string;
    meetingId: string;
    evidence: ThreatEvidence;
    resolved: boolean;
    resolvedAt?: Date;
}
export declare enum ThreatType {
    SCREEN_RECORDING = "screen_recording",
    MEDIA_RECORDER = "media_recorder",
    THIRD_PARTY_SOFTWARE = "third_party_software",
    SUSPICIOUS_NETWORK = "suspicious_network",
    UNAUTHORIZED_ACCESS = "unauthorized_access"
}
export declare enum ThreatSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface ThreatEvidence {
    screenshot?: string;
    networkActivity?: NetworkActivityLog[];
    softwareDetected?: string[];
    apiCalls?: string[];
    metadata: Record<string, any>;
}
export interface NetworkActivityLog {
    timestamp: Date;
    type: string;
    destination: string;
    size: number;
    suspicious: boolean;
}
export interface Recording {
    id: string;
    meetingId: string;
    type: RecordingType;
    status: RecordingStatus;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    fileUrl?: string;
    transcription?: TranscriptionData;
    permissions: DocumentPermissions;
}
export declare enum RecordingType {
    AUDIO = "audio",
    VIDEO = "video",
    SCREEN = "screen",
    TRANSCRIPT_ONLY = "transcript_only"
}
export declare enum RecordingStatus {
    RECORDING = "recording",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    DELETED = "deleted"
}
export interface TranscriptionData {
    id: string;
    meetingId: string;
    segments: TranscriptionSegment[];
    summary: MeetingSummary;
    actionItems: ActionItem[];
    speakers: SpeakerIdentification[];
    language: string;
    confidence: number;
    processingTime: number;
}
export interface TranscriptionSegment {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
    speakerId: string;
    confidence: number;
    redacted: boolean;
    sensitiveInfo?: SensitiveInfoType[];
}
export interface MeetingSummary {
    keyPoints: string[];
    decisions: string[];
    topics: string[];
    sentiment: SentimentAnalysis;
    duration: number;
    participantEngagement: ParticipantEngagement[];
}
export interface ActionItem {
    id: string;
    text: string;
    assigneeId?: string;
    dueDate?: Date;
    priority: ActionItemPriority;
    status: ActionItemStatus;
    extractedAt: Date;
    confidence: number;
    context: string;
}
export declare enum ActionItemPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum ActionItemStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export interface SpeakerIdentification {
    speakerId: string;
    userId?: string;
    name?: string;
    voiceProfile: VoiceProfile;
    confidence: number;
}
export interface VoiceProfile {
    pitch: number;
    tempo: number;
    accent?: string;
    characteristics: string[];
}
export declare enum SensitiveInfoType {
    SSN = "ssn",
    CREDIT_CARD = "credit_card",
    PASSWORD = "password",
    EMAIL = "email",
    PHONE = "phone",
    API_KEY = "api_key"
}
export interface SentimentAnalysis {
    overall: SentimentScore;
    byParticipant: Record<string, SentimentScore>;
    trends: SentimentTrend[];
}
export interface SentimentScore {
    positive: number;
    negative: number;
    neutral: number;
    confidence: number;
}
export interface SentimentTrend {
    timestamp: Date;
    score: SentimentScore;
}
export interface ParticipantEngagement {
    userId: string;
    speakTime: number;
    interactionCount: number;
    attentionScore: number;
    engagementLevel: EngagementLevel;
}
export declare enum EngagementLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export interface PrivateChannel {
    id: string;
    meetingId: string;
    participants: string[];
    createdBy: string;
    createdAt: Date;
    endedAt?: Date;
    isActive: boolean;
    encryptionKey: string;
    audioConfig: PrivateAudioConfig;
    zeroRecordingGuarantee: boolean;
}
export interface PrivateAudioConfig {
    mainMeetingVolume: number;
    privateChannelVolume: number;
    audioBalance: number;
    noiseReduction: boolean;
    echoCancellation: boolean;
}
export interface Space {
    id: string;
    name: string;
    description?: string;
    type: SpaceType;
    organizationIds: string[];
    ownerId: string;
    participants: SpaceParticipant[];
    threads: Thread[];
    permissions: SpacePermissions;
    createdAt: Date;
    updatedAt: Date;
    isArchived: boolean;
}
export declare enum SpaceType {
    INTERNAL = "internal",
    CROSS_COMPANY = "cross_company",
    PUBLIC = "public",
    PRIVATE = "private"
}
export interface SpaceParticipant {
    userId: string;
    role: SpaceRole;
    permissions: SpaceParticipantPermissions;
    joinedAt: Date;
}
export declare enum SpaceRole {
    OWNER = "owner",
    ADMIN = "admin",
    MEMBER = "member",
    GUEST = "guest"
}
export interface SpacePermissions {
    canCreateThreads: boolean;
    canInviteUsers: boolean;
    canManagePermissions: boolean;
    canDeleteSpace: boolean;
    crossCompanyAccess: boolean;
}
export interface SpaceParticipantPermissions {
    canRead: boolean;
    canWrite: boolean;
    canCreateThreads: boolean;
    canInviteUsers: boolean;
    canManageThreads: boolean;
}
export interface Thread {
    id: string;
    spaceId: string;
    title: string;
    description?: string;
    createdBy: string;
    participants: string[];
    messages: Message[];
    subThreads: Thread[];
    parentThreadId?: string;
    status: ThreadStatus;
    priority: ThreadPriority;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
    isArchived: boolean;
    aiSuggestions: AISuggestion[];
}
export declare enum ThreadStatus {
    ACTIVE = "active",
    RESOLVED = "resolved",
    ARCHIVED = "archived",
    LOCKED = "locked"
}
export declare enum ThreadPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export interface Message {
    id: string;
    threadId: string;
    authorId: string;
    content: string;
    type: MessageType;
    attachments: Attachment[];
    mentions: string[];
    reactions: Reaction[];
    replies: Message[];
    parentMessageId?: string;
    createdAt: Date;
    updatedAt?: Date;
    isEdited: boolean;
    isDeleted: boolean;
    metadata: MessageMetadata;
}
export declare enum MessageType {
    TEXT = "text",
    FILE = "file",
    IMAGE = "image",
    VOICE = "voice",
    VIDEO = "video",
    SYSTEM = "system",
    AI_SUGGESTION = "ai_suggestion"
}
export interface Attachment {
    id: string;
    filename: string;
    fileType: string;
    fileSize: number;
    url: string;
    thumbnail?: string;
    permissions: DocumentPermissions;
    drm: DRMConfig;
}
export interface Reaction {
    emoji: string;
    userId: string;
    timestamp: Date;
}
export interface MessageMetadata {
    readBy: ReadReceipt[];
    editHistory: MessageEdit[];
    aiAnalysis?: AIMessageAnalysis;
}
export interface ReadReceipt {
    userId: string;
    readAt: Date;
}
export interface MessageEdit {
    editedAt: Date;
    previousContent: string;
    reason?: string;
}
export interface AIMessageAnalysis {
    sentiment: SentimentScore;
    topics: string[];
    actionItems: ActionItem[];
    urgency: UrgencyLevel;
    suggestions: string[];
}
export declare enum UrgencyLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface AISuggestion {
    id: string;
    type: SuggestionType;
    content: string;
    confidence: number;
    context: string;
    createdAt: Date;
    accepted: boolean;
    acceptedAt?: Date;
}
export declare enum SuggestionType {
    THREAD_CREATION = "thread_creation",
    PARTICIPANT_INVITE = "participant_invite",
    ACTION_ITEM = "action_item",
    REMINDER = "reminder",
    WORKFLOW_OPTIMIZATION = "workflow_optimization"
}
export interface Reminder {
    id: string;
    userId: string;
    title: string;
    description?: string;
    type: ReminderType;
    context: ReminderContext;
    triggerTime: Date;
    recurring: RecurringConfig;
    status: ReminderStatus;
    automatedActions: AutomatedAction[];
    overlapDetection: OverlapDetection;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ReminderType {
    MEETING = "meeting",
    TASK = "task",
    DEADLINE = "deadline",
    FOLLOW_UP = "follow_up",
    CONTEXTUAL = "contextual"
}
export interface ReminderContext {
    chatId?: string;
    meetingId?: string;
    threadId?: string;
    projectId?: string;
    relatedUsers: string[];
    metadata: Record<string, any>;
}
export interface RecurringConfig {
    enabled: boolean;
    frequency: RecurringFrequency;
    interval: number;
    endDate?: Date;
    weekdays?: number[];
}
export declare enum RecurringFrequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
}
export declare enum ReminderStatus {
    SCHEDULED = "scheduled",
    TRIGGERED = "triggered",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    SNOOZED = "snoozed"
}
export interface AutomatedAction {
    id: string;
    type: AutomatedActionType;
    config: AutomatedActionConfig;
    status: AutomatedActionStatus;
    executedAt?: Date;
    result?: string;
}
export declare enum AutomatedActionType {
    SEND_MESSAGE = "send_message",
    CREATE_MEETING = "create_meeting",
    ASSIGN_TASK = "assign_task",
    SEND_EMAIL = "send_email",
    UPDATE_STATUS = "update_status"
}
export interface AutomatedActionConfig {
    recipients?: string[];
    message?: string;
    duration?: Duration;
    metadata: Record<string, any>;
}
export declare enum AutomatedActionStatus {
    PENDING = "pending",
    EXECUTING = "executing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export interface Duration {
    value: number;
    unit: DurationUnit;
}
export declare enum DurationUnit {
    MINUTES = "minutes",
    HOURS = "hours",
    DAYS = "days",
    WEEKS = "weeks"
}
export interface OverlapDetection {
    enabled: boolean;
    conflictingReminders: string[];
    resolution: OverlapResolution;
    directMessage?: DirectMessage;
}
export declare enum OverlapResolution {
    MERGE = "merge",
    PRIORITIZE = "prioritize",
    NOTIFY = "notify",
    CANCEL = "cancel"
}
export interface DirectMessage {
    recipientId: string;
    message: string;
    sentAt: Date;
    acknowledged: boolean;
}
export interface OverlapAlert {
    reminderId: string;
    conflictingReminderIds: string[];
    description: string;
    suggestedResolution: OverlapResolution;
}
export interface UserContext {
    userId: string;
    role: UserRole;
    industry: IndustryType;
    behaviorPatterns: BehaviorPattern[];
    workingHours: WorkingHours;
    preferences: UserPreferences;
    teamContext: TeamContext;
    projectContext: ProjectContext[];
}
export interface BehaviorPattern {
    type: BehaviorType;
    frequency: number;
    confidence: number;
    lastObserved: Date;
    metadata: Record<string, any>;
}
export declare enum BehaviorType {
    MEETING_FREQUENCY = "meeting_frequency",
    COMMUNICATION_STYLE = "communication_style",
    WORK_SCHEDULE = "work_schedule",
    FEATURE_USAGE = "feature_usage",
    COLLABORATION_PATTERN = "collaboration_pattern"
}
export interface WorkingHours {
    timezone: string;
    startTime: string;
    endTime: string;
    workdays: number[];
    breaks: TimeSlot[];
}
export interface TimeSlot {
    startTime: string;
    endTime: string;
}
export interface TeamContext {
    teamId: string;
    teamSize: number;
    teamRole: string;
    collaborationFrequency: number;
    teamEfficiency: TeamEfficiencyMetrics;
}
export interface ProjectContext {
    projectId: string;
    role: string;
    involvement: number;
    timeline: ProjectTimeline;
    risks: ProjectRisk[];
}
export interface ProjectTimeline {
    startDate: Date;
    endDate: Date;
    milestones: Milestone[];
    currentPhase: string;
    progress: number;
}
export interface Milestone {
    id: string;
    name: string;
    dueDate: Date;
    status: MilestoneStatus;
    dependencies: string[];
}
export declare enum MilestoneStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    DELAYED = "delayed",
    CANCELLED = "cancelled"
}
export interface ProjectRisk {
    id: string;
    type: RiskType;
    severity: RiskSeverity;
    probability: number;
    description: string;
    mitigation: string;
    status: RiskStatus;
}
export declare enum RiskType {
    SCHEDULE = "schedule",
    BUDGET = "budget",
    TECHNICAL = "technical",
    RESOURCE = "resource",
    EXTERNAL = "external"
}
export declare enum RiskSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum RiskStatus {
    IDENTIFIED = "identified",
    MONITORING = "monitoring",
    MITIGATED = "mitigated",
    REALIZED = "realized"
}
export interface SessionData {
    sessionId: string;
    startTime: Date;
    duration: number;
    actions: UserAction[];
    features: FeatureUsage[];
    performance: PerformanceMetrics;
}
export interface UserAction {
    type: string;
    timestamp: Date;
    context: Record<string, any>;
    duration?: number;
}
export interface FeatureUsage {
    feature: string;
    usageCount: number;
    totalTime: number;
    lastUsed: Date;
    efficiency: number;
}
export interface PerformanceMetrics {
    responseTime: number;
    errorRate: number;
    satisfaction: number;
    completionRate: number;
}
export interface TeamEfficiencyMetrics {
    communicationSpeed: number;
    meetingEfficiency: number;
    taskCompletionRate: number;
    collaborationScore: number;
    bottlenecks: Bottleneck[];
}
export interface Bottleneck {
    type: string;
    severity: number;
    description: string;
    suggestedImprovement: string;
}
export interface ProjectMetrics {
    projectId: string;
    timeline: ProjectTimeline;
    budget: BudgetMetrics;
    team: TeamMetrics;
    quality: QualityMetrics;
    risks: ProjectRisk[];
    predictions: ProjectPrediction[];
}
export interface BudgetMetrics {
    allocated: number;
    spent: number;
    projected: number;
    variance: number;
}
export interface TeamMetrics {
    size: number;
    efficiency: number;
    satisfaction: number;
    turnover: number;
    skillGaps: string[];
}
export interface QualityMetrics {
    defectRate: number;
    customerSatisfaction: number;
    codeQuality: number;
    testCoverage: number;
}
export interface ProjectPrediction {
    type: PredictionType;
    confidence: number;
    prediction: string;
    recommendedActions: string[];
    timeline: Date;
}
export declare enum PredictionType {
    DELAY_RISK = "delay_risk",
    BUDGET_OVERRUN = "budget_overrun",
    QUALITY_ISSUE = "quality_issue",
    RESOURCE_SHORTAGE = "resource_shortage",
    SUCCESS_PROBABILITY = "success_probability"
}
export interface MeetingData {
    purpose: string;
    expectedDuration: number;
    requiredSkills: string[];
    currentParticipants: string[];
    projectContext?: string;
    urgency: UrgencyLevel;
    previousMeetings: string[];
}
export interface TeamData {
    teamId: string;
    members: TeamMember[];
    projects: string[];
    workflows: Workflow[];
    performance: TeamPerformance;
    challenges: TeamChallenge[];
}
export interface TeamMember {
    userId: string;
    role: string;
    skills: Skill[];
    availability: Availability;
    performance: MemberPerformance;
}
export interface Skill {
    name: string;
    level: SkillLevel;
    verified: boolean;
    lastUsed: Date;
}
export declare enum SkillLevel {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    EXPERT = "expert"
}
export interface Availability {
    status: AvailabilityStatus;
    schedule: TimeSlot[];
    timezone: string;
    nextAvailable: Date;
}
export declare enum AvailabilityStatus {
    AVAILABLE = "available",
    BUSY = "busy",
    DO_NOT_DISTURB = "do_not_disturb",
    OFFLINE = "offline"
}
export interface MemberPerformance {
    productivity: number;
    quality: number;
    collaboration: number;
    innovation: number;
    trends: PerformanceTrend[];
}
export interface PerformanceTrend {
    metric: string;
    direction: TrendDirection;
    significance: number;
    period: string;
}
export declare enum TrendDirection {
    IMPROVING = "improving",
    DECLINING = "declining",
    STABLE = "stable"
}
export interface Workflow {
    id: string;
    name: string;
    steps: WorkflowStep[];
    efficiency: number;
    automationPotential: number;
    bottlenecks: string[];
}
export interface WorkflowStep {
    id: string;
    name: string;
    duration: number;
    dependencies: string[];
    assignee?: string;
    automated: boolean;
}
export interface TeamPerformance {
    overall: number;
    velocity: number;
    quality: number;
    satisfaction: number;
    collaboration: number;
    innovation: number;
}
export interface TeamChallenge {
    type: ChallengeType;
    severity: ChallengeSeverity;
    description: string;
    impact: string;
    suggestedSolutions: string[];
}
export declare enum ChallengeType {
    COMMUNICATION = "communication",
    SKILLS_GAP = "skills_gap",
    PROCESS = "process",
    TECHNOLOGY = "technology",
    COLLABORATION = "collaboration"
}
export declare enum ChallengeSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface Document {
    id: string;
    filename: string;
    fileType: string;
    fileSize: number;
    content?: string;
    url: string;
    thumbnail?: string;
    ownerId: string;
    permissions: DocumentPermissions;
    drm: DRMConfig;
    blockchain: BlockchainLog[];
    watermarks: DocumentWatermark[];
    accessHistory: DocumentAccess[];
    createdAt: Date;
    updatedAt: Date;
    version: number;
    tags: string[];
    metadata: DocumentMetadata;
}
export interface DocumentPermissions {
    canView: string[];
    canEdit: string[];
    canDownload: string[];
    canShare: string[];
    canDelete: string[];
    expiryDate?: Date;
    ipRestrictions?: string[];
    deviceRestrictions?: string[];
}
export interface DRMConfig {
    enabled: boolean;
    encryptionLevel: EncryptionLevel;
    downloadPrevention: boolean;
    printPrevention: boolean;
    copyPrevention: boolean;
    screenshotPrevention: boolean;
    watermarkingEnabled: boolean;
    accessLogging: boolean;
    timeBasedAccess?: TimeBasedAccess;
}
export interface TimeBasedAccess {
    startTime: Date;
    endTime: Date;
    maxAccessDuration?: number;
    maxAccessCount?: number;
}
export interface BlockchainLog {
    id: string;
    documentId: string;
    userId: string;
    action: DocumentAction;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    hash: string;
    previousHash?: string;
    verified: boolean;
}
export declare enum DocumentAction {
    VIEW = "view",
    EDIT = "edit",
    DOWNLOAD = "download",
    SHARE = "share",
    DELETE = "delete",
    PRINT = "print",
    COPY = "copy"
}
export interface DocumentWatermark {
    id: string;
    type: WatermarkType;
    content: string;
    position: WatermarkPosition;
    opacity: number;
    dynamic: boolean;
    userId: string;
    timestamp: Date;
}
export declare enum WatermarkType {
    TEXT = "text",
    IMAGE = "image",
    QR_CODE = "qr_code",
    INVISIBLE = "invisible"
}
export interface DocumentAccess {
    id: string;
    userId: string;
    action: DocumentAction;
    timestamp: Date;
    duration: number;
    ipAddress: string;
    deviceInfo: DeviceInfo;
    success: boolean;
    denialReason?: string;
}
export interface DeviceInfo {
    deviceId: string;
    deviceType: string;
    browser: string;
    os: string;
    trusted: boolean;
}
export interface DocumentMetadata {
    author: string;
    subject: string;
    keywords: string[];
    classification: DocumentClassification;
    retention: RetentionPolicy;
    complianceFlags: ComplianceFlag[];
}
export declare enum DocumentClassification {
    PUBLIC = "public",
    INTERNAL = "internal",
    CONFIDENTIAL = "confidential",
    RESTRICTED = "restricted",
    TOP_SECRET = "top_secret"
}
export interface RetentionPolicy {
    retentionPeriod: number;
    retentionUnit: RetentionUnit;
    autoDelete: boolean;
    archiveAfter?: number;
}
export declare enum RetentionUnit {
    DAYS = "days",
    MONTHS = "months",
    YEARS = "years"
}
export interface ComplianceFlag {
    type: ComplianceType;
    requirement: string;
    status: ComplianceStatus;
    lastChecked: Date;
}
export declare enum ComplianceStatus {
    COMPLIANT = "compliant",
    NON_COMPLIANT = "non_compliant",
    PENDING = "pending",
    EXEMPTED = "exempted"
}
export interface SearchFilters {
    dateRange?: DateRange;
    participants?: string[];
    spaces?: string[];
    threads?: string[];
    documentTypes?: string[];
    classification?: DocumentClassification[];
    tags?: string[];
    sentimentRange?: SentimentRange;
}
export interface DateRange {
    startDate: Date;
    endDate: Date;
}
export interface SentimentRange {
    minPositive?: number;
    maxPositive?: number;
    minNegative?: number;
    maxNegative?: number;
}
export interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    content: string;
    relevance: number;
    highlights: string[];
    metadata: Record<string, any>;
    timestamp: Date;
}
export declare enum SearchResultType {
    MESSAGE = "message",
    MEETING = "meeting",
    DOCUMENT = "document",
    TRANSCRIPT = "transcript",
    THREAD = "thread",
    USER = "user"
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    pagination?: PaginationInfo;
    metadata?: Record<string, any>;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface WebRTCConfig {
    iceServers: RTCIceServer[];
    mediaConstraints: MediaStreamConstraints;
    dataChannels: DataChannelConfig[];
    securitySettings: WebRTCSecuritySettings;
}
export interface DataChannelConfig {
    label: string;
    ordered: boolean;
    maxRetransmits?: number;
    maxPacketLifeTime?: number;
}
export type RTCIceTransportPolicy = 'relay' | 'all';
export interface WebRTCSecuritySettings {
    encryptionMandatory: boolean;
    dtlsFingerprinting: boolean;
    srtpProfiles: string[];
    iceTransportPolicy: RTCIceTransportPolicy;
}
export interface SignalingMessage {
    type: SignalingType;
    data: any;
    from: string;
    to?: string;
    meetingId: string;
    timestamp: Date;
}
export declare enum SignalingType {
    OFFER = "offer",
    ANSWER = "answer",
    ICE_CANDIDATE = "ice_candidate",
    JOIN_MEETING = "join_meeting",
    LEAVE_MEETING = "leave_meeting",
    MUTE_AUDIO = "mute_audio",
    MUTE_VIDEO = "mute_video",
    SCREEN_SHARE = "screen_share",
    PRIVATE_CHANNEL = "private_channel",
    SECURITY_ALERT = "security_alert"
}
export interface IndustryModule {
    type: IndustryType;
    features: IndustryFeature[];
    integrations: Integration[];
    workflows: IndustryWorkflow[];
    compliance: ComplianceRequirement[];
}
export interface IndustryFeature {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    config: Record<string, any>;
}
export interface Integration {
    id: string;
    name: string;
    type: IntegrationType;
    status: IntegrationStatus;
    config: IntegrationConfig;
    lastSync?: Date;
}
export declare enum IntegrationType {
    GITHUB = "github",
    GITLAB = "gitlab",
    JIRA = "jira",
    SLACK = "slack",
    TEAMS = "teams",
    CALENDAR = "calendar",
    SSO = "sso",
    STORAGE = "storage"
}
export declare enum IntegrationStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    ERROR = "error",
    PENDING = "pending"
}
export interface IntegrationConfig {
    apiKey?: string;
    webhookUrl?: string;
    syncInterval?: number;
    mappings: FieldMapping[];
    permissions: string[];
}
export interface FieldMapping {
    localField: string;
    remoteField: string;
    transformation?: string;
}
export interface IndustryWorkflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
    conditions: WorkflowCondition[];
}
export interface WorkflowTrigger {
    type: TriggerType;
    config: Record<string, any>;
}
export declare enum TriggerType {
    EVENT = "event",
    SCHEDULE = "schedule",
    CONDITION = "condition",
    MANUAL = "manual"
}
export interface WorkflowCondition {
    field: string;
    operator: ConditionOperator;
    value: any;
}
export declare enum ConditionOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    CONTAINS = "contains",
    EXISTS = "exists"
}
export interface ComplianceRequirement {
    type: ComplianceType;
    description: string;
    mandatory: boolean;
    implemented: boolean;
    validationRules: ValidationRule[];
}
export interface ValidationRule {
    field: string;
    rule: string;
    message: string;
    severity: ValidationSeverity;
}
export declare enum ValidationSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
export interface SocketEvent {
    type: SocketEventType;
    data: any;
    userId?: string;
    meetingId?: string;
    spaceId?: string;
    threadId?: string;
    timestamp: Date;
}
export declare enum SocketEventType {
    USER_JOINED = "user_joined",
    USER_LEFT = "user_left",
    MESSAGE_SENT = "message_sent",
    MESSAGE_EDITED = "message_edited",
    MESSAGE_DELETED = "message_deleted",
    THREAD_CREATED = "thread_created",
    THREAD_UPDATED = "thread_updated",
    MEETING_STARTED = "meeting_started",
    MEETING_ENDED = "meeting_ended",
    SECURITY_ALERT = "security_alert",
    REMINDER_TRIGGERED = "reminder_triggered",
    DOCUMENT_SHARED = "document_shared",
    TYPING_START = "typing_start",
    TYPING_STOP = "typing_stop",
    PRESENCE_UPDATE = "presence_update"
}
export interface AppConfig {
    environment: Environment;
    database: DatabaseConfig;
    redis: RedisConfig;
    websocket: WebSocketConfig;
    security: SecurityConfig;
    ai: AIConfig;
    integrations: IntegrationConfig[];
    features: FeatureFlags;
}
export declare enum Environment {
    DEVELOPMENT = "development",
    STAGING = "staging",
    PRODUCTION = "production"
}
export interface DatabaseConfig {
    uri: string;
    options: Record<string, any>;
    poolSize: number;
    ssl: boolean;
}
export interface RedisConfig {
    uri: string;
    keyPrefix: string;
    ttl: number;
}
export interface WebSocketConfig {
    port: number;
    cors: CORSConfig;
    rateLimit: RateLimitConfig;
}
export interface CORSConfig {
    origin: string[];
    credentials: boolean;
}
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
}
export interface SecurityConfig {
    jwtSecret: string;
    jwtExpiry: string;
    encryption: EncryptionConfig;
    recordingPrevention: RecordingPreventionConfig;
    blockchain: BlockchainConfig;
}
export interface EncryptionConfig {
    algorithm: string;
    keyLength: number;
    keyRotationInterval: number;
}
export interface BlockchainConfig {
    network: string;
    contractAddress: string;
    gasLimit: number;
    privateKey: string;
}
export interface AIConfig {
    openai: OpenAIConfig;
    transcription: TranscriptionConfig;
    sentiment: SentimentConfig;
}
export interface OpenAIConfig {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
}
export interface TranscriptionConfig {
    provider: string;
    language: string;
    realTime: boolean;
    speakerIdentification: boolean;
}
export interface SentimentConfig {
    provider: string;
    threshold: number;
    languages: string[];
}
export interface FeatureFlags {
    recordingPrevention: boolean;
    privateChannels: boolean;
    aiTranscription: boolean;
    crossCompanySpaces: boolean;
    documentDRM: boolean;
    blockchainLogging: boolean;
    industryModules: boolean;
}
//# sourceMappingURL=index.d.ts.map