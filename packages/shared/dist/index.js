"use strict";
// Shared TypeScript interfaces and types for SecureSync Pro
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalingType = exports.SearchResultType = exports.ComplianceStatus = exports.RetentionUnit = exports.DocumentClassification = exports.WatermarkType = exports.DocumentAction = exports.ChallengeSeverity = exports.ChallengeType = exports.TrendDirection = exports.AvailabilityStatus = exports.SkillLevel = exports.PredictionType = exports.RiskStatus = exports.RiskSeverity = exports.RiskType = exports.MilestoneStatus = exports.BehaviorType = exports.OverlapResolution = exports.DurationUnit = exports.AutomatedActionStatus = exports.AutomatedActionType = exports.ReminderStatus = exports.RecurringFrequency = exports.ReminderType = exports.SuggestionType = exports.UrgencyLevel = exports.MessageType = exports.ThreadPriority = exports.ThreadStatus = exports.SpaceRole = exports.SpaceType = exports.EngagementLevel = exports.SensitiveInfoType = exports.ActionItemStatus = exports.ActionItemPriority = exports.RecordingStatus = exports.RecordingType = exports.ThreatSeverity = exports.ThreatType = exports.AlertLevel = exports.ThreatSensitivity = exports.WatermarkPosition = exports.EncryptionLevel = exports.ParticipantRole = exports.MeetingType = exports.MeetingStatus = exports.ComplianceType = exports.IndustryType = exports.UserRole = void 0;
exports.Environment = exports.SocketEventType = exports.ValidationSeverity = exports.ConditionOperator = exports.TriggerType = exports.IntegrationStatus = exports.IntegrationType = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MODERATOR"] = "moderator";
    UserRole["USER"] = "user";
    UserRole["GUEST"] = "guest";
    UserRole["ENTERPRISE_ADMIN"] = "enterprise_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var IndustryType;
(function (IndustryType) {
    IndustryType["DEVELOPMENT_AGENCY"] = "development_agency";
    IndustryType["RESEARCH_INSTITUTION"] = "research_institution";
    IndustryType["MEDIA_PRODUCTION"] = "media_production";
    IndustryType["ENTERPRISE"] = "enterprise";
})(IndustryType || (exports.IndustryType = IndustryType = {}));
var ComplianceType;
(function (ComplianceType) {
    ComplianceType["SOC2"] = "soc2";
    ComplianceType["GDPR"] = "gdpr";
    ComplianceType["HIPAA"] = "hipaa";
    ComplianceType["ISO27001"] = "iso27001";
})(ComplianceType || (exports.ComplianceType = ComplianceType = {}));
var MeetingStatus;
(function (MeetingStatus) {
    MeetingStatus["SCHEDULED"] = "scheduled";
    MeetingStatus["IN_PROGRESS"] = "in_progress";
    MeetingStatus["ENDED"] = "ended";
    MeetingStatus["CANCELLED"] = "cancelled";
})(MeetingStatus || (exports.MeetingStatus = MeetingStatus = {}));
var MeetingType;
(function (MeetingType) {
    MeetingType["STANDARD"] = "standard";
    MeetingType["HIGH_SECURITY"] = "high_security";
    MeetingType["CROSS_COMPANY"] = "cross_company";
    MeetingType["PRIVATE"] = "private";
})(MeetingType || (exports.MeetingType = MeetingType = {}));
var ParticipantRole;
(function (ParticipantRole) {
    ParticipantRole["HOST"] = "host";
    ParticipantRole["CO_HOST"] = "co_host";
    ParticipantRole["PARTICIPANT"] = "participant";
    ParticipantRole["OBSERVER"] = "observer";
})(ParticipantRole || (exports.ParticipantRole = ParticipantRole = {}));
var EncryptionLevel;
(function (EncryptionLevel) {
    EncryptionLevel["STANDARD"] = "standard";
    EncryptionLevel["HIGH"] = "high";
    EncryptionLevel["MAXIMUM"] = "maximum";
})(EncryptionLevel || (exports.EncryptionLevel = EncryptionLevel = {}));
var WatermarkPosition;
(function (WatermarkPosition) {
    WatermarkPosition["TOP_LEFT"] = "top-left";
    WatermarkPosition["TOP_RIGHT"] = "top-right";
    WatermarkPosition["BOTTOM_LEFT"] = "bottom-left";
    WatermarkPosition["BOTTOM_RIGHT"] = "bottom-right";
    WatermarkPosition["CENTER"] = "center";
})(WatermarkPosition || (exports.WatermarkPosition = WatermarkPosition = {}));
var ThreatSensitivity;
(function (ThreatSensitivity) {
    ThreatSensitivity["LOW"] = "low";
    ThreatSensitivity["MEDIUM"] = "medium";
    ThreatSensitivity["HIGH"] = "high";
    ThreatSensitivity["MAXIMUM"] = "maximum";
})(ThreatSensitivity || (exports.ThreatSensitivity = ThreatSensitivity = {}));
var AlertLevel;
(function (AlertLevel) {
    AlertLevel["INFO"] = "info";
    AlertLevel["WARNING"] = "warning";
    AlertLevel["CRITICAL"] = "critical";
})(AlertLevel || (exports.AlertLevel = AlertLevel = {}));
var ThreatType;
(function (ThreatType) {
    ThreatType["SCREEN_RECORDING"] = "screen_recording";
    ThreatType["MEDIA_RECORDER"] = "media_recorder";
    ThreatType["THIRD_PARTY_SOFTWARE"] = "third_party_software";
    ThreatType["SUSPICIOUS_NETWORK"] = "suspicious_network";
    ThreatType["UNAUTHORIZED_ACCESS"] = "unauthorized_access";
})(ThreatType || (exports.ThreatType = ThreatType = {}));
var ThreatSeverity;
(function (ThreatSeverity) {
    ThreatSeverity["LOW"] = "low";
    ThreatSeverity["MEDIUM"] = "medium";
    ThreatSeverity["HIGH"] = "high";
    ThreatSeverity["CRITICAL"] = "critical";
})(ThreatSeverity || (exports.ThreatSeverity = ThreatSeverity = {}));
var RecordingType;
(function (RecordingType) {
    RecordingType["AUDIO"] = "audio";
    RecordingType["VIDEO"] = "video";
    RecordingType["SCREEN"] = "screen";
    RecordingType["TRANSCRIPT_ONLY"] = "transcript_only";
})(RecordingType || (exports.RecordingType = RecordingType = {}));
var RecordingStatus;
(function (RecordingStatus) {
    RecordingStatus["RECORDING"] = "recording";
    RecordingStatus["PROCESSING"] = "processing";
    RecordingStatus["COMPLETED"] = "completed";
    RecordingStatus["FAILED"] = "failed";
    RecordingStatus["DELETED"] = "deleted";
})(RecordingStatus || (exports.RecordingStatus = RecordingStatus = {}));
var ActionItemPriority;
(function (ActionItemPriority) {
    ActionItemPriority["LOW"] = "low";
    ActionItemPriority["MEDIUM"] = "medium";
    ActionItemPriority["HIGH"] = "high";
    ActionItemPriority["URGENT"] = "urgent";
})(ActionItemPriority || (exports.ActionItemPriority = ActionItemPriority = {}));
var ActionItemStatus;
(function (ActionItemStatus) {
    ActionItemStatus["PENDING"] = "pending";
    ActionItemStatus["IN_PROGRESS"] = "in_progress";
    ActionItemStatus["COMPLETED"] = "completed";
    ActionItemStatus["CANCELLED"] = "cancelled";
})(ActionItemStatus || (exports.ActionItemStatus = ActionItemStatus = {}));
var SensitiveInfoType;
(function (SensitiveInfoType) {
    SensitiveInfoType["SSN"] = "ssn";
    SensitiveInfoType["CREDIT_CARD"] = "credit_card";
    SensitiveInfoType["PASSWORD"] = "password";
    SensitiveInfoType["EMAIL"] = "email";
    SensitiveInfoType["PHONE"] = "phone";
    SensitiveInfoType["API_KEY"] = "api_key";
})(SensitiveInfoType || (exports.SensitiveInfoType = SensitiveInfoType = {}));
var EngagementLevel;
(function (EngagementLevel) {
    EngagementLevel["LOW"] = "low";
    EngagementLevel["MEDIUM"] = "medium";
    EngagementLevel["HIGH"] = "high";
    EngagementLevel["VERY_HIGH"] = "very_high";
})(EngagementLevel || (exports.EngagementLevel = EngagementLevel = {}));
var SpaceType;
(function (SpaceType) {
    SpaceType["INTERNAL"] = "internal";
    SpaceType["CROSS_COMPANY"] = "cross_company";
    SpaceType["PUBLIC"] = "public";
    SpaceType["PRIVATE"] = "private";
})(SpaceType || (exports.SpaceType = SpaceType = {}));
var SpaceRole;
(function (SpaceRole) {
    SpaceRole["OWNER"] = "owner";
    SpaceRole["ADMIN"] = "admin";
    SpaceRole["MEMBER"] = "member";
    SpaceRole["GUEST"] = "guest";
})(SpaceRole || (exports.SpaceRole = SpaceRole = {}));
var ThreadStatus;
(function (ThreadStatus) {
    ThreadStatus["ACTIVE"] = "active";
    ThreadStatus["RESOLVED"] = "resolved";
    ThreadStatus["ARCHIVED"] = "archived";
    ThreadStatus["LOCKED"] = "locked";
})(ThreadStatus || (exports.ThreadStatus = ThreadStatus = {}));
var ThreadPriority;
(function (ThreadPriority) {
    ThreadPriority["LOW"] = "low";
    ThreadPriority["NORMAL"] = "normal";
    ThreadPriority["HIGH"] = "high";
    ThreadPriority["URGENT"] = "urgent";
})(ThreadPriority || (exports.ThreadPriority = ThreadPriority = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["FILE"] = "file";
    MessageType["IMAGE"] = "image";
    MessageType["VOICE"] = "voice";
    MessageType["VIDEO"] = "video";
    MessageType["SYSTEM"] = "system";
    MessageType["AI_SUGGESTION"] = "ai_suggestion";
})(MessageType || (exports.MessageType = MessageType = {}));
var UrgencyLevel;
(function (UrgencyLevel) {
    UrgencyLevel["LOW"] = "low";
    UrgencyLevel["MEDIUM"] = "medium";
    UrgencyLevel["HIGH"] = "high";
    UrgencyLevel["CRITICAL"] = "critical";
})(UrgencyLevel || (exports.UrgencyLevel = UrgencyLevel = {}));
var SuggestionType;
(function (SuggestionType) {
    SuggestionType["THREAD_CREATION"] = "thread_creation";
    SuggestionType["PARTICIPANT_INVITE"] = "participant_invite";
    SuggestionType["ACTION_ITEM"] = "action_item";
    SuggestionType["REMINDER"] = "reminder";
    SuggestionType["WORKFLOW_OPTIMIZATION"] = "workflow_optimization";
})(SuggestionType || (exports.SuggestionType = SuggestionType = {}));
var ReminderType;
(function (ReminderType) {
    ReminderType["MEETING"] = "meeting";
    ReminderType["TASK"] = "task";
    ReminderType["DEADLINE"] = "deadline";
    ReminderType["FOLLOW_UP"] = "follow_up";
    ReminderType["CONTEXTUAL"] = "contextual";
})(ReminderType || (exports.ReminderType = ReminderType = {}));
var RecurringFrequency;
(function (RecurringFrequency) {
    RecurringFrequency["DAILY"] = "daily";
    RecurringFrequency["WEEKLY"] = "weekly";
    RecurringFrequency["MONTHLY"] = "monthly";
    RecurringFrequency["YEARLY"] = "yearly";
})(RecurringFrequency || (exports.RecurringFrequency = RecurringFrequency = {}));
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["SCHEDULED"] = "scheduled";
    ReminderStatus["TRIGGERED"] = "triggered";
    ReminderStatus["COMPLETED"] = "completed";
    ReminderStatus["CANCELLED"] = "cancelled";
    ReminderStatus["SNOOZED"] = "snoozed";
})(ReminderStatus || (exports.ReminderStatus = ReminderStatus = {}));
var AutomatedActionType;
(function (AutomatedActionType) {
    AutomatedActionType["SEND_MESSAGE"] = "send_message";
    AutomatedActionType["CREATE_MEETING"] = "create_meeting";
    AutomatedActionType["ASSIGN_TASK"] = "assign_task";
    AutomatedActionType["SEND_EMAIL"] = "send_email";
    AutomatedActionType["UPDATE_STATUS"] = "update_status";
})(AutomatedActionType || (exports.AutomatedActionType = AutomatedActionType = {}));
var AutomatedActionStatus;
(function (AutomatedActionStatus) {
    AutomatedActionStatus["PENDING"] = "pending";
    AutomatedActionStatus["EXECUTING"] = "executing";
    AutomatedActionStatus["COMPLETED"] = "completed";
    AutomatedActionStatus["FAILED"] = "failed";
})(AutomatedActionStatus || (exports.AutomatedActionStatus = AutomatedActionStatus = {}));
var DurationUnit;
(function (DurationUnit) {
    DurationUnit["MINUTES"] = "minutes";
    DurationUnit["HOURS"] = "hours";
    DurationUnit["DAYS"] = "days";
    DurationUnit["WEEKS"] = "weeks";
})(DurationUnit || (exports.DurationUnit = DurationUnit = {}));
var OverlapResolution;
(function (OverlapResolution) {
    OverlapResolution["MERGE"] = "merge";
    OverlapResolution["PRIORITIZE"] = "prioritize";
    OverlapResolution["NOTIFY"] = "notify";
    OverlapResolution["CANCEL"] = "cancel";
})(OverlapResolution || (exports.OverlapResolution = OverlapResolution = {}));
var BehaviorType;
(function (BehaviorType) {
    BehaviorType["MEETING_FREQUENCY"] = "meeting_frequency";
    BehaviorType["COMMUNICATION_STYLE"] = "communication_style";
    BehaviorType["WORK_SCHEDULE"] = "work_schedule";
    BehaviorType["FEATURE_USAGE"] = "feature_usage";
    BehaviorType["COLLABORATION_PATTERN"] = "collaboration_pattern";
})(BehaviorType || (exports.BehaviorType = BehaviorType = {}));
var MilestoneStatus;
(function (MilestoneStatus) {
    MilestoneStatus["NOT_STARTED"] = "not_started";
    MilestoneStatus["IN_PROGRESS"] = "in_progress";
    MilestoneStatus["COMPLETED"] = "completed";
    MilestoneStatus["DELAYED"] = "delayed";
    MilestoneStatus["CANCELLED"] = "cancelled";
})(MilestoneStatus || (exports.MilestoneStatus = MilestoneStatus = {}));
var RiskType;
(function (RiskType) {
    RiskType["SCHEDULE"] = "schedule";
    RiskType["BUDGET"] = "budget";
    RiskType["TECHNICAL"] = "technical";
    RiskType["RESOURCE"] = "resource";
    RiskType["EXTERNAL"] = "external";
})(RiskType || (exports.RiskType = RiskType = {}));
var RiskSeverity;
(function (RiskSeverity) {
    RiskSeverity["LOW"] = "low";
    RiskSeverity["MEDIUM"] = "medium";
    RiskSeverity["HIGH"] = "high";
    RiskSeverity["CRITICAL"] = "critical";
})(RiskSeverity || (exports.RiskSeverity = RiskSeverity = {}));
var RiskStatus;
(function (RiskStatus) {
    RiskStatus["IDENTIFIED"] = "identified";
    RiskStatus["MONITORING"] = "monitoring";
    RiskStatus["MITIGATED"] = "mitigated";
    RiskStatus["REALIZED"] = "realized";
})(RiskStatus || (exports.RiskStatus = RiskStatus = {}));
var PredictionType;
(function (PredictionType) {
    PredictionType["DELAY_RISK"] = "delay_risk";
    PredictionType["BUDGET_OVERRUN"] = "budget_overrun";
    PredictionType["QUALITY_ISSUE"] = "quality_issue";
    PredictionType["RESOURCE_SHORTAGE"] = "resource_shortage";
    PredictionType["SUCCESS_PROBABILITY"] = "success_probability";
})(PredictionType || (exports.PredictionType = PredictionType = {}));
var SkillLevel;
(function (SkillLevel) {
    SkillLevel["BEGINNER"] = "beginner";
    SkillLevel["INTERMEDIATE"] = "intermediate";
    SkillLevel["ADVANCED"] = "advanced";
    SkillLevel["EXPERT"] = "expert";
})(SkillLevel || (exports.SkillLevel = SkillLevel = {}));
var AvailabilityStatus;
(function (AvailabilityStatus) {
    AvailabilityStatus["AVAILABLE"] = "available";
    AvailabilityStatus["BUSY"] = "busy";
    AvailabilityStatus["DO_NOT_DISTURB"] = "do_not_disturb";
    AvailabilityStatus["OFFLINE"] = "offline";
})(AvailabilityStatus || (exports.AvailabilityStatus = AvailabilityStatus = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["IMPROVING"] = "improving";
    TrendDirection["DECLINING"] = "declining";
    TrendDirection["STABLE"] = "stable";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var ChallengeType;
(function (ChallengeType) {
    ChallengeType["COMMUNICATION"] = "communication";
    ChallengeType["SKILLS_GAP"] = "skills_gap";
    ChallengeType["PROCESS"] = "process";
    ChallengeType["TECHNOLOGY"] = "technology";
    ChallengeType["COLLABORATION"] = "collaboration";
})(ChallengeType || (exports.ChallengeType = ChallengeType = {}));
var ChallengeSeverity;
(function (ChallengeSeverity) {
    ChallengeSeverity["LOW"] = "low";
    ChallengeSeverity["MEDIUM"] = "medium";
    ChallengeSeverity["HIGH"] = "high";
    ChallengeSeverity["CRITICAL"] = "critical";
})(ChallengeSeverity || (exports.ChallengeSeverity = ChallengeSeverity = {}));
var DocumentAction;
(function (DocumentAction) {
    DocumentAction["VIEW"] = "view";
    DocumentAction["EDIT"] = "edit";
    DocumentAction["DOWNLOAD"] = "download";
    DocumentAction["SHARE"] = "share";
    DocumentAction["DELETE"] = "delete";
    DocumentAction["PRINT"] = "print";
    DocumentAction["COPY"] = "copy";
})(DocumentAction || (exports.DocumentAction = DocumentAction = {}));
var WatermarkType;
(function (WatermarkType) {
    WatermarkType["TEXT"] = "text";
    WatermarkType["IMAGE"] = "image";
    WatermarkType["QR_CODE"] = "qr_code";
    WatermarkType["INVISIBLE"] = "invisible";
})(WatermarkType || (exports.WatermarkType = WatermarkType = {}));
var DocumentClassification;
(function (DocumentClassification) {
    DocumentClassification["PUBLIC"] = "public";
    DocumentClassification["INTERNAL"] = "internal";
    DocumentClassification["CONFIDENTIAL"] = "confidential";
    DocumentClassification["RESTRICTED"] = "restricted";
    DocumentClassification["TOP_SECRET"] = "top_secret";
})(DocumentClassification || (exports.DocumentClassification = DocumentClassification = {}));
var RetentionUnit;
(function (RetentionUnit) {
    RetentionUnit["DAYS"] = "days";
    RetentionUnit["MONTHS"] = "months";
    RetentionUnit["YEARS"] = "years";
})(RetentionUnit || (exports.RetentionUnit = RetentionUnit = {}));
var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["COMPLIANT"] = "compliant";
    ComplianceStatus["NON_COMPLIANT"] = "non_compliant";
    ComplianceStatus["PENDING"] = "pending";
    ComplianceStatus["EXEMPTED"] = "exempted";
})(ComplianceStatus || (exports.ComplianceStatus = ComplianceStatus = {}));
var SearchResultType;
(function (SearchResultType) {
    SearchResultType["MESSAGE"] = "message";
    SearchResultType["MEETING"] = "meeting";
    SearchResultType["DOCUMENT"] = "document";
    SearchResultType["TRANSCRIPT"] = "transcript";
    SearchResultType["THREAD"] = "thread";
    SearchResultType["USER"] = "user";
})(SearchResultType || (exports.SearchResultType = SearchResultType = {}));
var SignalingType;
(function (SignalingType) {
    SignalingType["OFFER"] = "offer";
    SignalingType["ANSWER"] = "answer";
    SignalingType["ICE_CANDIDATE"] = "ice_candidate";
    SignalingType["JOIN_MEETING"] = "join_meeting";
    SignalingType["LEAVE_MEETING"] = "leave_meeting";
    SignalingType["MUTE_AUDIO"] = "mute_audio";
    SignalingType["MUTE_VIDEO"] = "mute_video";
    SignalingType["SCREEN_SHARE"] = "screen_share";
    SignalingType["PRIVATE_CHANNEL"] = "private_channel";
    SignalingType["SECURITY_ALERT"] = "security_alert";
})(SignalingType || (exports.SignalingType = SignalingType = {}));
var IntegrationType;
(function (IntegrationType) {
    IntegrationType["GITHUB"] = "github";
    IntegrationType["GITLAB"] = "gitlab";
    IntegrationType["JIRA"] = "jira";
    IntegrationType["SLACK"] = "slack";
    IntegrationType["TEAMS"] = "teams";
    IntegrationType["CALENDAR"] = "calendar";
    IntegrationType["SSO"] = "sso";
    IntegrationType["STORAGE"] = "storage";
})(IntegrationType || (exports.IntegrationType = IntegrationType = {}));
var IntegrationStatus;
(function (IntegrationStatus) {
    IntegrationStatus["ACTIVE"] = "active";
    IntegrationStatus["INACTIVE"] = "inactive";
    IntegrationStatus["ERROR"] = "error";
    IntegrationStatus["PENDING"] = "pending";
})(IntegrationStatus || (exports.IntegrationStatus = IntegrationStatus = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["EVENT"] = "event";
    TriggerType["SCHEDULE"] = "schedule";
    TriggerType["CONDITION"] = "condition";
    TriggerType["MANUAL"] = "manual";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
var ConditionOperator;
(function (ConditionOperator) {
    ConditionOperator["EQUALS"] = "equals";
    ConditionOperator["NOT_EQUALS"] = "not_equals";
    ConditionOperator["GREATER_THAN"] = "greater_than";
    ConditionOperator["LESS_THAN"] = "less_than";
    ConditionOperator["CONTAINS"] = "contains";
    ConditionOperator["EXISTS"] = "exists";
})(ConditionOperator || (exports.ConditionOperator = ConditionOperator = {}));
var ValidationSeverity;
(function (ValidationSeverity) {
    ValidationSeverity["INFO"] = "info";
    ValidationSeverity["WARNING"] = "warning";
    ValidationSeverity["ERROR"] = "error";
    ValidationSeverity["CRITICAL"] = "critical";
})(ValidationSeverity || (exports.ValidationSeverity = ValidationSeverity = {}));
var SocketEventType;
(function (SocketEventType) {
    SocketEventType["USER_JOINED"] = "user_joined";
    SocketEventType["USER_LEFT"] = "user_left";
    SocketEventType["MESSAGE_SENT"] = "message_sent";
    SocketEventType["MESSAGE_EDITED"] = "message_edited";
    SocketEventType["MESSAGE_DELETED"] = "message_deleted";
    SocketEventType["THREAD_CREATED"] = "thread_created";
    SocketEventType["THREAD_UPDATED"] = "thread_updated";
    SocketEventType["MEETING_STARTED"] = "meeting_started";
    SocketEventType["MEETING_ENDED"] = "meeting_ended";
    SocketEventType["SECURITY_ALERT"] = "security_alert";
    SocketEventType["REMINDER_TRIGGERED"] = "reminder_triggered";
    SocketEventType["DOCUMENT_SHARED"] = "document_shared";
    SocketEventType["TYPING_START"] = "typing_start";
    SocketEventType["TYPING_STOP"] = "typing_stop";
    SocketEventType["PRESENCE_UPDATE"] = "presence_update";
})(SocketEventType || (exports.SocketEventType = SocketEventType = {}));
var Environment;
(function (Environment) {
    Environment["DEVELOPMENT"] = "development";
    Environment["STAGING"] = "staging";
    Environment["PRODUCTION"] = "production";
})(Environment || (exports.Environment = Environment = {}));
//# sourceMappingURL=index.js.map