const StarNotary = artifacts.require('StarNotary');

var accounts;
var owner;

contract('StarNotary', (accs) => {
  accounts = accs;
  owner = accounts[0];
});

it('can Create a Star', async () => {
  let tokenId = 1;
  let user1 = accounts[0];

  let instance = await StarNotary.deployed();
  await instance.createStar('Awesome Star!', tokenId, { from: user1 });
  let starName = await instance.tokenIdToStarInfo.call(tokenId);
  assert.equal(starName, 'Awesome Star!');
});

it('lets user1 put up their star for sale', async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[0];
  let starId = 2;
  let starPrice = web3.utils.toWei('.01', 'ether');
  await instance.createStar('awesome star', starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 3;
  let starPrice = web3.utils.toWei('.01', 'ether');
  let balance = web3.utils.toWei('.05', 'ether');

  await instance.createStar('awesome star', starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  let balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
  await instance.approve(user2, starId, { from: user1 });
  await instance.buyStar(starId, { from: user2, value: balance });
  const balanceAfterUser2BuyStar = await web3.eth.getBalance(user2);

  let balanceBeforeTransaction = Number(balanceOfUser2BeforeTransaction);
  let balanceAfterTransaction = Number(balanceAfterUser2BuyStar);

  assert.isAbove(balanceBeforeTransaction, balanceAfterTransaction);
});

it('lets user2 buy a star, if it is put up for sale', async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 4;
  let starPrice = web3.utils.toWei('.01', 'ether');
  let balance = web3.utils.toWei('.05', 'ether');
  instance.contractAddress = instance.address;
  await instance.createStar('awesome star', starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  await instance.approve(user2, starId, { from: user1 });
  await instance.buyStar(starId, { from: user2, value: balance });

  assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 5;
  let starPrice = web3.utils.toWei('.01', 'ether');
  let balance = web3.utils.toWei('.05', 'ether');
  let gasPrice = web3.utils.toWei('.0001', 'ether');

  await instance.createStar('awesome star', starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  let balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
  await instance.approve(user2, starId, { from: user1 });
  await instance.buyStar(starId, { from: user2, value: balance, gasPrice });
  const balanceAfterUser2BuyStar = await web3.eth.getBalance(user2);

  let balanceBeforeTransaction = Number(balanceOfUser2BeforeTransaction);
  let balanceAfterTransaction = Number(balanceAfterUser2BuyStar);

  let starPriceAsNumber = Number(starPrice);
  let gasFeeAsNumber = Number(gasPrice);
  let gasAndStarprice = gasFeeAsNumber + starPriceAsNumber;

  let totalDeductedFromUser2Account =
    balanceBeforeTransaction - balanceAfterTransaction;

  assert.isBelow(balanceAfterTransaction, balanceBeforeTransaction);
  assert.isAtMost(gasAndStarprice, totalDeductedFromUser2Account);
});

// Implement Task 2 Add supporting unit tests
it('can add the star name and star symbol properly', async () => {
  // 1. create a Star with different tokenId
  //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
  let tokenId = 6;
  let user1 = accounts[0];

  let instance = await StarNotary.deployed();
  await instance.createStar('Awesome Star!', tokenId, { from: user1 });
  let name = await instance.name();
  let symbol = await instance.symbol();
  assert.equal(name, 'StarNotary');
  assert.equal(symbol, 'STR');
});

it('lets 2 users exchange stars', async () => {
  // 1. create 2 Stars with different tokenId
  // 2. Call the exchangeStars functions implemented in the Smart Contract
  // 3. Verify that the owners changed
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId1 = 7;
  let starId2 = 8;

  await instance.createStar('awesome star 1', starId1, { from: user1 });
  await instance.createStar('awesome star 2', starId2, { from: user2 });
  await instance.approve(user2, starId1, { from: user1 });
  await instance.approve(user1, starId2, { from: user2 });

  await instance.exchangeStars(starId1, starId2, { from: user1 });
  assert.equal(await instance.ownerOf.call(starId1), user2);
  assert.equal(await instance.ownerOf.call(starId2), user1);
});

it('lookUptokenIdToStarInfo test', async () => {
  // 1. create a Star with different tokenId
  let instance = await StarNotary.deployed();

  let user1 = accounts[1];
  let starId = 9;

  await instance.createStar('awesome star', starId, { from: user1 });
  // 2. Call your method lookUptokenIdToStarInfo
  const starName = await instance.lookUptokenIdToStarInfo.call(starId);

  // 3. Verify if you Star name is the same
  assert.equal(starName, 'awesome star');
});

it('lets a user transfer a star', async () => {
  // 1. create a Star with different tokenId
  let instance = await StarNotary.deployed();
  let user1 = accounts[0];
  let user2 = accounts[1];
  let starId = 10;
  await instance.createStar('awesome star', starId, { from: user1 });
  await instance.approve(user2, starId, { from: user1 });

  // 2. use the transferStar function implemented in the Smart Contract
  let newOwner = await instance.transferStar.call(user2, starId);

  // // 3. Verify the star owner changed.
  assert.equal(newOwner, user2);
});
