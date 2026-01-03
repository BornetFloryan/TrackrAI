pipeline {
    agent any

    environment {
        CENTRAL_HOST = "central"
        CENTRAL_PORT = "9000"
        API_BASE_URL = "http://api:4567/trackrapi"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://gitlab.iut-fcomte.fr/trackrai/TrackrAI.git'
            }
        }

        stage('Build & Start Services') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml up -d --build'
            }
        }

        stage('Wait for services') {
            steps {
                sh 'sleep 15'
            }
        }

        stage('Run Acceptance Tests') {
            steps {
                dir('TrackrAIAcceptanceTests') {
                    sh 'mvn test'
                }
            }
        }
    }

    post {
        always {
            sh 'docker compose -f docker-compose.ci.yml down'
        }
        success {
            echo '✔️ Tests d’acceptation réussis'
        }
        failure {
            echo '❌ Tests d’acceptation en échec'
        }
    }
}
