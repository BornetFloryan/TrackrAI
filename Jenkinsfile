pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    environment {
        COMPOSE_PROJECT_NAME = "trackrai-ci"
        CENTRAL_HOST = "localhost"
        CENTRAL_PORT = "29000"
        API_BASE_URL = "http://localhost:4567/trackrapi"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Compose') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml config --quiet'
            }
        }

        stage('Build & Start Services') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml up -d --build --wait'
            }
        }

        stage('Verify Services') {
            steps {
                sh 'curl --fail --retry 10 --retry-delay 2 http://localhost:4567/trackrapi/health'
                sh 'curl --fail --retry 10 --retry-delay 2 http://localhost:8080/'
            }
        }

        stage('Run Acceptance Tests') {
            steps {
                dir('TrackrAIAcceptanceTests') {
                    sh 'mvn -B test'
                }
            }
        }
    }

    post {
        always {
            sh 'docker compose -f docker-compose.ci.yml down -v --remove-orphans'
        }
        success {
            echo 'Acceptance tests passed'
        }
        failure {
            echo 'Acceptance tests failed'
        }
    }
}
