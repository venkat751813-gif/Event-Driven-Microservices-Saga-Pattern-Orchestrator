import { Link } from 'react-router-dom';

export default function Guide() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">Field manual</p>
        <h1 className="font-display font-extrabold text-4xl mt-1">The saga pattern</h1>
        <p className="text-zinc-400 mt-3 leading-relaxed">
          A saga is a long-lived business transaction that spans multiple microservices.
          Instead of a two-phase commit, each local transaction publishes events and each
          failure is undone by a compensating transaction.
        </p>
      </div>

      <section className="rounded-2xl border border-white/8 bg-[#10131a] p-6 space-y-3">
        <h2 className="font-display font-bold text-xl">Orchestration vs choreography</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">Orchestrated</strong> sagas put a conductor in the middle.
          The orchestrator tells Payment to charge, waits for <span className="font-mono text-amber-200/80">PaymentCaptured</span>,
          then tells Inventory to reserve. Control flow is explicit — easier to reason about, a single place to add timeouts.
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">Choreographed</strong> sagas have no conductor. Inventory listens for
          <span className="font-mono text-amber-200/80">OrderCreated</span>, Payment listens for
          <span className="font-mono text-amber-200/80">StockReserved</span>. Loose coupling, harder debugging.
          SagaForge still records the implied sequence so you can export either style.
        </p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#10131a] p-6 space-y-3">
        <h2 className="font-display font-bold text-xl">Compensating transactions</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          If step N fails, steps 1…N−1 have already committed. Those writes cannot be locked across services,
          so each step declares an inverse: <span className="font-mono text-amber-200/80">ReserveInventory</span> ↔
          <span className="font-mono text-amber-200/80">ReleaseInventory</span>. The orchestrator runs compensations
          in reverse order until the system is consistent again — not atomically undone, but semantically undone.
        </p>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#10131a] p-6 space-y-3">
        <h2 className="font-display font-bold text-xl">How to use the forge</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-400">
          <li>Register the services that participate (bounded contexts, owners, endpoints).</li>
          <li>Create a saga. Choose orchestrated or choreographed.</li>
          <li>Add ordered steps: command, success event, failure event, compensate action, timeout, retries.</li>
          <li>Start an execution with a JSON payload. Succeed or fail each step — or auto-run the happy path.</li>
          <li>Fail mid-flight to watch compensation walk backwards through the event bus.</li>
          <li>Open Download Pack and export JSON, YAML, Java, TypeScript, or Mermaid.</li>
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/app/sagas" className="px-4 py-2 rounded-xl bg-amber-400 text-[#1a1003] text-sm font-semibold">Open catalog</Link>
        <Link to="/app/download" className="px-4 py-2 rounded-xl border border-white/10 text-sm">Download a pack</Link>
      </div>
    </div>
  );
}
