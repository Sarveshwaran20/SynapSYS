import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  configureFirebaseProject,
  fetchFirebaseStatus,
  syncBaselineToFirebase,
  type FirebaseConnectionStatus,
} from '../../lib/firebase';
import { dur, ease } from '../../lib/motion';
import {
  AnimatedNumber,
  MotionButton,
  PipelineFlow,
  Reveal,
  RevealGroup,
  RevealItem,
  SpotlightCard,
  StatusDot,
} from '../motion';

export interface FirebaseCloudPanelProps {
  status: FirebaseConnectionStatus;
  onStatusChange: (next: FirebaseConnectionStatus) => void;
  onEvent?: (
    label: string,
    category: string,
    tone?: 'blue' | 'emerald' | 'amber' | 'rose'
  ) => void;
}

export const FirebaseCloudPanel: React.FC<FirebaseCloudPanelProps> = React.memo(
  ({ status, onStatusChange, onEvent }) => {
    const shouldReduce = useReducedMotion();
    const [showConfigForm, setShowConfigForm] = useState(false);
    const [projectId, setProjectId] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [feedback, setFeedback] = useState<{
      type: 'success' | 'info' | 'error';
      text: string;
    } | null>(null);

    const isCloudConnected = status.connected && status.schema_ready;
    const isPartial = status.connected && !status.schema_ready;

    const badgeTone = isCloudConnected
      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
      : isPartial
      ? 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/35'
      : 'bg-g-blueLight text-g-blue border-g-blue/30';

    const badgeLabel = isCloudConnected
      ? 'Firestore Connected'
      : isPartial
      ? 'Security Rules / Auth Pending'
      : 'SQLite Fallback // Ready to Link';

    const handleRefreshStatus = async () => {
      setIsTesting(true);
      setFeedback(null);
      try {
        const next = await fetchFirebaseStatus(true);
        onStatusChange(next);
        onEvent?.(
          next.connected
            ? `Firebase Firestore health checked (${next.latency_ms ?? '--'} ms)`
            : 'Firebase probe returned local SQLite fallback',
          'Cloud',
          next.connected ? 'emerald' : 'blue'
        );
      } finally {
        setIsTesting(false);
      }
    };

    const handleConnectSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!projectId.trim()) {
        setFeedback({
          type: 'error',
          text: 'Enter your Firebase Project ID to link Firestore.',
        });
        return;
      }
      setIsTesting(true);
      setFeedback(null);
      try {
        const next = await configureFirebaseProject(projectId.trim(), apiKey.trim());
        onStatusChange(next);
        if (next.connected && next.schema_ready) {
          setFeedback({
            type: 'success',
            text: `Connected to Cloud Firestore (${next.project_id}) in ${next.latency_ms ?? '--'}ms.`,
          });
          onEvent?.(`Connected Firebase project ${next.project_id}`, 'Cloud', 'emerald');
        } else if (next.connected && !next.schema_ready) {
          setFeedback({
            type: 'info',
            text: next.last_error || 'Connected to Firestore. Ensure Security Rules permit read/write.',
          });
          onEvent?.('Firebase connected; awaiting Firestore permissions', 'Cloud', 'amber');
        } else {
          setFeedback({
            type: 'error',
            text: next.last_error || 'Could not reach Firebase Firestore REST endpoint.',
          });
        }
      } catch (err) {
        setFeedback({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'Backend offline. Add credentials to .env and start backend.',
        });
      } finally {
        setIsTesting(false);
      }
    };

    const handleSyncBaseline = async () => {
      setIsSyncing(true);
      setFeedback(null);
      try {
        const res = await syncBaselineToFirebase();
        onStatusChange(res.status);
        setFeedback({
          type: 'success',
          text: `Synced ${res.synced_sites} sites, ${res.synced_users} users, and ${res.synced_telemetry} live machine frames to Firestore.`,
        });
        onEvent?.(
          `Pushed baseline (${res.synced_sites} sites, ${res.synced_telemetry} frames) to Firestore`,
          'Cloud',
          'emerald'
        );
      } catch (err) {
        setFeedback({
          type: 'error',
          text: err instanceof Error ? err.message : 'Baseline sync requires connected Firestore collections.',
        });
      } finally {
        setIsSyncing(false);
      }
    };

    return (
      <Reveal immediate delay={0.08}>
        <SpotlightCard
          surface={false}
          notch={false}
          className="bg-g-surface border border-g-border rounded-xl p-6 shadow-sm flex flex-col gap-5 grid-container-surface"
        >
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-g-border pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusDot
                  status={isCloudConnected ? 'running' : isPartial ? 'standby' : 'live'}
                  size="md"
                />
                <h4 className="font-cinzel text-base sm:text-lg font-semibold text-g-text">
                  Firebase Cloud Firestore Bridge
                </h4>
                <span className={`text-xs px-2.5 py-0.5 rounded-md border font-mono font-medium ${badgeTone}`}>
                  {badgeLabel}
                </span>
              </div>
              <p className="text-sm text-g-textSecondary max-w-2xl leading-relaxed">
                Google Cloud Firestore multi-region persistence for asset hierarchies, operators, ISA-18.2 incidents, and live IIoT telemetry alongside zero-downtime local SQLite buffering.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <MotionButton
                type="button"
                loading={isTesting}
                onClick={handleRefreshStatus}
                className="px-3.5 py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-xs font-mono text-g-text cursor-pointer"
              >
                Check Health
              </MotionButton>

              <MotionButton
                primary
                type="button"
                onClick={() => setShowConfigForm((v) => !v)}
                className="px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-xs font-semibold cursor-pointer"
              >
                {showConfigForm ? 'Hide Setup' : 'Configure Firebase'}
              </MotionButton>
            </div>
          </div>

          {/* Live Sync Architecture Pipeline */}
          <div className="bg-g-surfaceElevated border border-g-border rounded-xl p-4">
            <PipelineFlow
              nodes={[
                { id: 'sqlite', label: 'Local SQLite Edge', color: 'var(--g-green)', active: true },
                { id: 'fastapi', label: 'FastAPI Dual-Write', color: 'var(--g-blue)', active: true },
                {
                  id: 'firestore',
                  label: 'Cloud Firestore REST',
                  color: status.connected ? 'var(--g-green)' : 'var(--g-yellow)',
                  active: status.connected,
                },
                {
                  id: 'realtime',
                  label: 'Firestore Realtime',
                  color: isCloudConnected ? 'var(--tyrian)' : 'var(--g-text-muted)',
                  active: isCloudConnected,
                },
              ]}
              links={[
                { id: 'fb-l1', connected: true },
                { id: 'fb-l2', connected: status.connected },
                { id: 'fb-l3', connected: isCloudConnected },
              ]}
              durationSec={2.4}
            />
          </div>

          {/* 4-Card Sync Metrics & Schema Registry Grid */}
          <RevealGroup immediate staggerDelay={0.05} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            <RevealItem variant="grid">
              <div className="p-3.5 rounded-lg bg-g-surfaceElevated border border-g-border flex flex-col justify-between h-full">
                <span className="text-[11px] font-mono uppercase text-g-textMuted">Project ID</span>
                <strong className="text-sm font-mono text-g-text mt-1 truncate">
                  {status.project_id ? `${status.project_id}` : 'Unlinked (.env / UI)'}
                </strong>
              </div>
            </RevealItem>
            <RevealItem variant="grid">
              <div className="p-3.5 rounded-lg bg-g-surfaceElevated border border-g-border flex flex-col justify-between h-full">
                <span className="text-[11px] font-mono uppercase text-g-textMuted">Firestore Latency</span>
                <strong className="text-sm font-mono text-g-blue mt-1">
                  {status.latency_ms !== null ? `${status.latency_ms} ms RTT` : 'Local Fallback Active'}
                </strong>
              </div>
            </RevealItem>
            <RevealItem variant="grid">
              <div className="p-3.5 rounded-lg bg-g-surfaceElevated border border-g-border flex flex-col justify-between h-full">
                <span className="text-[11px] font-mono uppercase text-g-textMuted">Cloud Writes Synced</span>
                <AnimatedNumber
                  value={status.synced_records || 0}
                  decimals={0}
                  suffix=" docs"
                  className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1 block"
                />
              </div>
            </RevealItem>
            <RevealItem variant="grid">
              <div className="p-3.5 rounded-lg bg-g-surfaceElevated border border-g-border flex flex-col justify-between h-full">
                <span className="text-[11px] font-mono uppercase text-g-textMuted">Collections</span>
                <span className="text-xs font-mono text-g-text mt-1">
                  users · sites · telemetry · alarms
                </span>
              </div>
            </RevealItem>
          </RevealGroup>

          {/* Configuration Form */}
          {showConfigForm && (
            <motion.form
              onSubmit={handleConnectSubmit}
              initial={shouldReduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.fast, ease }}
              className="p-4 sm:p-5 rounded-xl bg-g-surfaceElevated border border-g-border space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firebase-project-input" className="block text-xs font-mono text-g-textSecondary mb-1.5">
                    FIREBASE_PROJECT_ID
                  </label>
                  <input
                    id="firebase-project-input"
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="e.g. synapsys-industrial"
                    className="w-full h-10 px-3 rounded-lg bg-g-surface border border-g-border text-sm font-mono text-g-text focus:outline-none focus:border-g-blue"
                  />
                </div>
                <div>
                  <label htmlFor="firebase-api-key-input" className="block text-xs font-mono text-g-textSecondary mb-1.5">
                    FIREBASE_WEB_API_KEY (Optional)
                  </label>
                  <input
                    id="firebase-api-key-input"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full h-10 px-3 rounded-lg bg-g-surface border border-g-border text-sm font-mono text-g-text focus:outline-none focus:border-g-blue"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs text-g-textMuted font-mono">
                  Rules: firebase/firestore.rules
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <MotionButton
                    type="button"
                    loading={isSyncing}
                    disabled={!isCloudConnected}
                    onClick={handleSyncBaseline}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white text-xs font-semibold cursor-pointer"
                  >
                    Sync Baseline Seed →
                  </MotionButton>
                  <MotionButton
                    primary
                    type="submit"
                    loading={isTesting}
                    className="px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-xs font-semibold cursor-pointer"
                  >
                    Test &amp; Connect Firebase
                  </MotionButton>
                </div>
              </div>
            </motion.form>
          )}

          {feedback && (
            <div
              className={`px-4 py-2.5 rounded-lg border text-xs font-mono ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : feedback.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : 'bg-g-blueLight border-g-blue/30 text-g-blue'
              }`}
            >
              {feedback.text}
            </div>
          )}
        </SpotlightCard>
      </Reveal>
    );
  }
);

FirebaseCloudPanel.displayName = 'FirebaseCloudPanel';

