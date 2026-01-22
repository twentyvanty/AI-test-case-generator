type ResultPageProps = {
    requirement: string
    testType: string
}


function ResultPage({ requirement, testType }: ResultPageProps) {

    const cases = [
        {red: 'User1', green: 'Do1', reFactor:'result1'},
        {red: 'User2', green: 'Do2', reFactor:'result2'}
    ]
    const req = [
        {given: 'User1', when: 'Do1', then:'result1'},
        {given: 'User2', when: 'Do2', then:'result2'}
    ]

    return (
        <div>
            <h1>Result</h1>
            <p>Requirement: {requirement}</p>
            {/* <p>Test Type: {testType === 'BDD' && 'BDD' || testType === 'TDD' && 'TDD'}</p> */}
            {/* if test type = bdd then show bdd or show tdd if  = tdd */}
            {/* <div>
                {testType === 'TDD' && (
                    <p>Requirement: {requirement}
                    Red: ... <br />
                    Gree: ... <br />
                    Refactor: ... <br />
                    </p>
                )}
            </div> */}
            <div>
                {testType === 'TDD' && (
                    cases.map(oneCase => ( //map(): check every value and display
                        <div key={oneCase.red}>Red:{oneCase.red}
                        <p>Green:{oneCase.green}</p>
                        <p>Re-Factor:{oneCase.reFactor}</p>
                        </div>
                    ))
                )}
            </div>
            {/* {condition} && result */}
            <div>
                {testType === 'BDD' && (
                    req.map(oneReq => (
                        <div key={oneReq.given}>Given:{oneReq.given}
                        <p>When: {oneReq.when}</p>
                        <p>Then: {oneReq.then}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default ResultPage