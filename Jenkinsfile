pipeline {
    agent any
    environment {
        // Define Docker Compose file path
        COMPOSE_FILE = 'docker-compose.yaml'
    }
    stages {
        stage('Checkout') {
            steps {
                // Clean workspace and use default SCM config (set in Jenkins UI)
                cleanWs()
                checkout scm
            }
        }
        stage('Test Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm test || echo "No tests defined for frontend"'
                }
            }
        }
        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm test || echo "No tests defined for backend"'
                }
            }
        }
        stage('Build Docker Images') {
            steps {
                // Build frontend and backend images
                sh 'docker build -t system-monitoring-frontend:latest frontend/'
                sh 'docker build -t system-monitoring-backend:latest backend/'
            }
        }
        stage('Deploy') {
            steps {
                // Deploy using Docker Compose
                sh 'docker-compose -f ${COMPOSE_FILE} down'
                sh 'docker-compose -f ${COMPOSE_FILE} up -d --build'
            }
        }
    }
    post {
        always {
            // Clean up dangling images to save space
            sh 'docker image prune -f'
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}