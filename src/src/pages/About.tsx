export function About() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 2rem' }}>

      <h1 style={{
        fontSize: '2.2rem',
        fontWeight: 900,
        color: 'var(--logo-red)',
        letterSpacing: '-0.02em',
        marginBottom: '0.5rem',
        lineHeight: 1.1,
      }}>
        Talk is cheap.<br />Picks are forever.
      </h1>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
        The MMA prediction accountability project.
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Every fight week, without fail, your favourite MMA YouTubers drop their prediction videos.
          They've watched the tape. They've studied the styles. They've "done the research." And they
          will absolutely, confidently, tell you exactly who's going to win — and usually why it's
          not even going to be close.
        </p>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          But here's the thing nobody ever checks: <strong>are they actually right?</strong>
        </p>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
          Not vibes. Not memory. Not "I feel like they're usually pretty good." Actual numbers.
          Actual receipts. Fight by fight, event by event, across years of picks.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
          The MMA community deserves better than vibes
        </h2>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          The MMA space is packed with analysts, ex-fighters, obsessive fans, and full-time
          commentators — all breaking down the same fights, often reaching completely opposite
          conclusions. Some of them are genuinely sharp. Some of them just sound sharp. Until now,
          there was no way to tell the difference.
        </p>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
          That's exactly what OctaScore is built to fix.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
          We track everything
        </h2>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Not just the main events where everyone agrees anyway. We're talking full card coverage —
          prelims, main card, championship rounds. PPV blockbusters and Fight Night undercards.
          Slice it any way you want: how does someone do on main events specifically? How about PPV
          only? Does their accuracy tank when they have to pick 12 fights instead of 5?
        </p>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
          The filters are right there. The data doesn't lie.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
          Head-to-head, no excuses
        </h2>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
          We track multiple creators — all picking the same fights, all on the same playing field.
          Same events, same card, same results. The leaderboard is live and it's ruthless.
          Who's actually the sharpest analyst in the room? Check the board. The answer might
          surprise you.
        </p>
      </section>

      <div style={{
        marginTop: '2.5rem',
        padding: '1.25rem 1.5rem',
        borderLeft: `4px solid var(--logo-red)`,
        background: 'var(--bg-card)',
        borderRadius: '0 8px 8px 0',
      }}>
        <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "Everybody's got a plan until they get punched in the mouth." — Mike Tyson.<br />
          Everybody's got a prediction until the scoreboard goes up.
        </p>
      </div>

    </div>
  );
}
