type ResultPageProps = {
    requirement: string
    testType: string
}

function ResultPage({ requirement, testType }: ResultPageProps) {

    return (
        <div>
            <h1>Result</h1>
            <p>Requirement: {requirement}</p>
            {/* <p>Test Type: {testType === 'BDD' && 'BDD' || testType === 'TDD' && 'TDD'}</p> */}
            {/* if test type = bdd then show bdd or show tdd if  = tdd */}
            <div>
                {testType === 'TDD' && (
                    <p>Requirement: {requirement}
                    Red: ... <br />
                    Gree: ... <br />
                    Refactor: ... <br />
                    </p>
                )}
            </div>
        </div>
    )
}

export default ResultPage