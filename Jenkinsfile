pipeline {
  agent any

  stages {
    stage('Build Docker images') {
      steps {
        sh 'docker compose build'
      }
    }
  }
}
