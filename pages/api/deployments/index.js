// pages/api/deployments/index.js
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Check authentication
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // GET request to fetch user's deployments
  if (req.method === 'GET') {
    try {
      const deployments = await prisma.deployment.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return res.status(200).json(deployments);
    } catch (error) {
      console.error('Error fetching deployments:', error);
      return res.status(500).json({ message: 'Failed to fetch deployments' });
    } finally {
      await prisma.$disconnect();
    }
  }

  // POST request to create a new deployment
  if (req.method === 'POST') {
    try {
      const { deploymentId, code, language, liveUrl } = req.body;
      
      if (!deploymentId || !code || !language || !liveUrl) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const deployment = await prisma.deployment.create({
        data: {
          deploymentId,
          code,
          language,
          liveUrl,
          status: 'active',
          userId: session.user.id,
        },
      });
      
      return res.status(201).json(deployment);
    } catch (error) {
      console.error('Error creating deployment:', error);
      return res.status(500).json({ message: 'Failed to create deployment' });
    } finally {
      await prisma.$disconnect();
    }
  }

  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}