pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = "react-frontend:latest"
        BACKEND_IMAGE  = "node-backend:latest"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Cloning repository..."
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    echo "Building backend Docker image..."
                    sh 'docker build -t $BACKEND_IMAGE .'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    echo "Building frontend Docker image..."
                    sh 'docker build -t $FRONTEND_IMAGE .'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo "Stopping existing containers..."
                sh 'docker-compose down'

                echo "Starting new containers..."
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        success {
            echo 'Deployment succeeded!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
