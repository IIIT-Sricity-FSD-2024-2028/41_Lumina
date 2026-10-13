import Dean2Layout from './Dean2Layout';
import TierGate from '../../components/TierGate';
import styles from './Dean2.module.css';

export default function Dean2Analytics() {
  return (
    <Dean2Layout>
      <TierGate requiredTier="Campus" featureName="Enrollment Analytics &amp; Projections">
        <div className={styles.pageHeader}>
          <h1>Enrollment Monitoring</h1>
          <p>Track enrollment activity and capacity utilization across departments.</p>
        </div>

        {/* Year-wise Enrollment Progress */}
        <div className={styles.card}>
          <div className={styles.flexBetween} style={{ marginBottom: '1.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.1rem' }}>📊</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--d2-primary)' }}>
                  Year-wise Enrollment Progress
                </h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--d2-text-muted)' }}>
                Comparative analysis of enrollment targets across academic years
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                color: 'var(--d2-text-muted)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  background: 'var(--d2-primary)',
                  borderRadius: '50%',
                }}
              ></span>
              Actual Enrollment
            </div>
          </div>

          <div className={styles.grid2}>
            {/* 1st Year */}
            <div>
              <div className={styles.flexBetween} style={{ marginBottom: '6px' }}>
                <div>
                  <div className={styles.analyticsYearLabel}>1st Year</div>
                  <div className={styles.analyticsYearSub}>Freshman Intake</div>
                </div>
                <div className={styles.analyticsPct}>60%</div>
              </div>
              <div className={styles.progressBarBg} style={{ height: '12px' }}>
                <div className={styles.progressBarFill} style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* 2nd Year */}
            <div>
              <div className={styles.flexBetween} style={{ marginBottom: '6px' }}>
                <div>
                  <div className={styles.analyticsYearLabel}>2nd Year</div>
                  <div className={styles.analyticsYearSub}>Sophomore Retention</div>
                </div>
                <div className={styles.analyticsPct}>75%</div>
              </div>
              <div className={styles.progressBarBg} style={{ height: '12px' }}>
                <div className={styles.progressBarFill} style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* 3rd Year */}
            <div>
              <div className={styles.flexBetween} style={{ marginBottom: '6px' }}>
                <div>
                  <div className={styles.analyticsYearLabel}>3rd Year</div>
                  <div className={styles.analyticsYearSub}>Junior Specialization</div>
                </div>
                <div className={styles.analyticsPct}>80%</div>
              </div>
              <div className={styles.progressBarBg} style={{ height: '12px' }}>
                <div className={styles.progressBarFill} style={{ width: '80%' }}></div>
              </div>
            </div>

            {/* 4th Year */}
            <div>
              <div className={styles.flexBetween} style={{ marginBottom: '6px' }}>
                <div>
                  <div className={styles.analyticsYearLabel}>4th Year</div>
                  <div className={styles.analyticsYearSub}>Senior Graduation Track</div>
                </div>
                <div className={styles.analyticsPct}>92%</div>
              </div>
              <div className={styles.progressBarBg} style={{ height: '12px' }}>
                <div className={styles.progressBarFill} style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Statistics */}
        <div className={styles.card}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--d2-primary)', marginBottom: '1.5rem' }}>
            Department Statistics
          </h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Capacity</th>
                <th>Students Enrolled</th>
                <th>Utilization %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>CSE</strong>
                </td>
                <td>1,200</td>
                <td>980</td>
                <td>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBarBg} style={{ height: '8px' }}>
                      <div className={styles.progressBarFill} style={{ width: '82%' }}></div>
                    </div>
                    <span className={styles.utilizationHigh} style={{ minWidth: '38px' }}>
                      82%
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>ECE</strong>
                </td>
                <td>1,000</td>
                <td>750</td>
                <td>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBarBg} style={{ height: '8px' }}>
                      <div className={styles.progressBarFill} style={{ width: '75%' }}></div>
                    </div>
                    <span className={styles.utilizationMed} style={{ minWidth: '38px' }}>
                      75%
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>ME</strong>
                </td>
                <td>800</td>
                <td>400</td>
                <td>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBarBg} style={{ height: '8px' }}>
                      <div className={styles.progressBarFill} style={{ width: '50%' }}></div>
                    </div>
                    <span className={styles.utilizationLow} style={{ minWidth: '38px' }}>
                      50%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Course Capacity Monitoring */}
        <div className={styles.card}>
          <div className={styles.flexBetween} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--d2-primary)' }}>
              Course Capacity Monitoring
            </h3>
            <span className={styles.criticalBadge}>⚠️ Critical: Low Seats Remaining</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Type</th>
                <th>Capacity</th>
                <th>Enrolled</th>
                <th>Utilization %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>CS101</strong>
                </td>
                <td>Institute Core</td>
                <td>100</td>
                <td>98</td>
                <td>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBarBg} style={{ height: '8px' }}>
                      <div className={styles.progressBarFill} style={{ width: '98%', background: '#DC2626' }}></div>
                    </div>
                    <span className={styles.utilizationCrit} style={{ minWidth: '38px' }}>
                      98%
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>IC201</strong>
                </td>
                <td>Program Core</td>
                <td>80</td>
                <td>79</td>
                <td>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBarBg} style={{ height: '8px' }}>
                      <div className={styles.progressBarFill} style={{ width: '99%', background: '#DC2626' }}></div>
                    </div>
                    <span className={styles.utilizationCrit} style={{ minWidth: '38px' }}>
                      99%
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>CE205</strong>
                </td>
                <td>Core Elective</td>
                <td>60</td>
                <td>45</td>
                <td>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBarBg} style={{ height: '8px' }}>
                      <div className={styles.progressBarFill} style={{ width: '75%' }}></div>
                    </div>
                    <span className={styles.utilizationMed} style={{ minWidth: '38px' }}>
                      75%
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>SE101</strong>
                </td>
                <td>SEED</td>
                <td>120</td>
                <td>110</td>
                <td>
                  <div className={styles.progressRow}>
                    <div className={styles.progressBarBg} style={{ height: '8px' }}>
                      <div className={styles.progressBarFill} style={{ width: '92%' }}></div>
                    </div>
                    <span className={styles.utilizationHigh} style={{ minWidth: '38px' }}>
                      92%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TierGate>
    </Dean2Layout>
  );
}
