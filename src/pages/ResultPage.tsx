type ResultPageProps = {
    requirement: string
    testType: string
}

function ResultPage({ requirement, testType }: ResultPageProps) {
    return (
        <div>
            <h1>Ressult</h1>
            <p>Requirement: {requirement}</p>
            <p>Test Type: {testType}</p>
        </div>
    )
}

export default ResultPage