export default function ProblemsPanel({ problems }) {
  return (
    <section className="problems-panel">
      <h2>Validation and model notes</h2>
      {problems.length === 0 ? (
        <p>No problems reported by the MVP normalizer.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th>Code</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, index) => (
              <tr key={`${problem.id}-${index}`} className={`problem problem--${problem.level}`}>
                <td>{problem.level}</td>
                <td>{problem.code}</td>
                <td>{problem.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
