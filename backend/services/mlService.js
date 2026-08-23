
class MLService {
  async sendCoordinates(latitude, longitude) {
    //HERE I WILL INTEGRATE THE ENDPOINT
    
    // Simulate slight processing/network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      status: 'pending_integration',
      message: 'ML model endpoint is not configured yet. Coordinates processed successfully.',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new MLService();
